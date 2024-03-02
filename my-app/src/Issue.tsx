import { useCallback, useState } from "react";
import { aesEncrpyt, pre, uploadToIPFS, encodeObject, generateAESKey, generateBNKeyPair, encodeBNKeyPair } from "./Encryption";
import { useWeb3Context } from "./hooks/useWeb3Context";
import { useAtmanIssueContract } from "./hooks/useContract";
import React from "react";
import DelegateVerifierRow from "./components/DelegateVerifierEntry";
import styles from "./Issue.module.css";

type Role = 'verifier' | 'delegate';

interface Permission {
  id: number;
  text: string;
  role: Role;
  timestamp: number;
}

export function Issue() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const { account } = useWeb3Context();
  const contract = useAtmanIssueContract();
  const [rows, setRows] = useState<Permission[]>([
    { id: 0, text: '', role: 'verifier', timestamp: Date.now() }
  ]);

  const addRow = () => {
    setRows(prevRows => [
      ...prevRows,
      { id: prevRows.length + 1, text: '', role: 'verifier', timestamp: Date.now() }
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  async function formatData(data: string, account: string, rows: Permission[]) {
    const aesKey = generateAESKey();
    const ciphertextWithIv = aesEncrpyt(data, aesKey);

    const bnKeyPair = await generateBNKeyPair();
    const encodedBNKeyPair = encodeBNKeyPair(bnKeyPair);
    console.log(`sk: ${JSON.stringify(encodedBNKeyPair)}`);

    const receiverBNKeyPair = await generateBNKeyPair();
    const preResult = await pre(aesKey, bnKeyPair, receiverBNKeyPair.publicKey);

    const dataToBeUploaded = {
      data: ciphertextWithIv,
      pre: preResult,
    };
    const cid = await uploadToIPFS(
      JSON.stringify(encodeObject(dataToBeUploaded))
    );

    const outputData = {
      cid: cid,
      data: dataToBeUploaded,
    };
    console.log(`Output: ${JSON.stringify(outputData)}`);

    return outputData;
  }
  
  const issueContent = useCallback(async () => {
    const { cid } = await formatData(text, account!, rows);

    const { hash } = await contract!.functions.setDataEntry(
      cid,
      'IPFS',
      account!,
      []
    );

    const ethscanUrl = `https://sepolia.etherscan.io/tx/${hash}`;
    setOutput(ethscanUrl);

  }, [text, account, contract, rows]);

  return (
    <div>
      <h2>Issue data</h2>
      <input
        className={styles.inputField} // add this class
        id="textInput"
        type="text"
        placeholder="Enter content"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className={styles.rowsContainer}>
        {rows.map((row) => (
          <DelegateVerifierRow key={row.id} id={row.id} onRemove={removeRow} />
        ))}
      </div>
      <div className={styles.buttonContainer}>
        <button 
          className={styles.buttonPrimary} // add this class
          type="button" 
          onClick={addRow}
        >
          Add Row
        </button>
        <button 
          className={styles.buttonPrimary} // add this class
          type="button" 
          onClick={issueContent}
        >
          Issue
        </button>
      </div>
      <p id="output">{output}</p>
    </div>
  );
}
