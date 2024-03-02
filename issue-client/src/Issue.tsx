import { useCallback, useState } from "react";
import { aesEncrpyt, pre, uploadToIPFS, encodeObject, generateAESKey, generateBNKeyPair, encodeBNKeyPair } from "./Encryption";
import { useWeb3Context } from "./hooks/useWeb3Context";
import { useAtmanIssueContract, useIdentityStorageContract } from "./hooks/useContract";
import React from "react";
import DelegateVerifierRow, { Permission, Role } from "./components/DelegateVerifierEntry";
import styles from "./Issue.module.css";

export function Issue() {
  const [text, setText] = useState("");
  const [signature, setSignature] = useState("");
  const [cid, setCid] = useState("");
  const [output, setOutput] = useState("");
  const { account } = useWeb3Context();
  const atmanIssueContract = useAtmanIssueContract();
  const identityContract = useIdentityStorageContract();
  const [rows, setRows] = useState<Permission[]>([
    { id: 0, address: '', role: 'verifier', timestamp: Date.now() }
  ]);

  const addRow = () => {
    setRows(prevRows => [
      ...prevRows,
      { id: prevRows.length + 1, address: '', role: 'verifier', timestamp: Date.now() }
    ]);
  };

  const handleRowChange = (id: number, field: keyof Permission, value: string | number) => {
    setRows(prevRows => prevRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const removeRow = (id: number) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  async function formatData(content: string, account: string, rows: Permission[]) {
    // @ts-ignore
    const { ethereum } = window;
    const signature = await ethereum.request({ method: 'personal_sign', params: [content, account] });
    setSignature(signature);

    const data = JSON.stringify({ content, signature }) as string;

    const aesKey = generateAESKey();
    const ciphertextWithIv = aesEncrpyt(data, aesKey);

    const bnKeyPair = await generateBNKeyPair();
    const encodedBNKeyPair = encodeBNKeyPair(bnKeyPair);

    const receiverPublicKeys = await Promise.all(rows.map(async (_) => {
      const receiverBNKeyPair = await generateBNKeyPair();
      return receiverBNKeyPair.publicKey;
    }));
    const preResult = await pre(aesKey, bnKeyPair, receiverPublicKeys);

    const dataToBeUploaded = {
      data: ciphertextWithIv,
      pre: preResult,
    };
    const cid = await uploadToIPFS(
      JSON.stringify(encodeObject(dataToBeUploaded))
    );
    setCid(cid);

    const permissions = rows.map((row) => {
      return {
        id: row.address,
        permission: row.role === 'delegate' ? 0 : 1,
        expiredAt: row.timestamp,
      };
    });

    return {
      cid: cid,
      encodedBNKeyPair: encodedBNKeyPair,
      data: dataToBeUploaded,
      permissions: permissions
    };
  }

  const issueContent = useCallback(async () => {
    const { cid, encodedBNKeyPair, permissions } = await formatData(text, account!, rows);

    const identityResult = await identityContract!.functions.setIdentity(encodedBNKeyPair.publicKey, "0xab");
    console.log(`IDENTITY: https://sepolia.etherscan.io/tx/${identityResult.hash}`);

    const { hash } = await atmanIssueContract!.functions.setDataEntry(
      cid,
      'IPFS',
      account!,
      permissions
    );

    const ethscanUrl = `https://sepolia.etherscan.io/tx/${hash}`;
    setOutput(ethscanUrl);

  }, [text, account, atmanIssueContract, identityContract, rows]);

  return (
    <div>
      <h2>Issue data</h2>
      <input
        className={styles.inputField}
        id="textInput"
        type="text"
        placeholder="Enter content"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <>signature</>
      <input
        id="signatureOutput"
        type="text"
        placeholder="signature"
        value={signature}
        readOnly={true}
      />
      <>cid</>
      <input
        id="cidOutput"
        type="text"
        placeholder="cid"
        value={cid}
        readOnly={true}
      />
      <div className={styles.rowsContainer}>
        {rows.map((row) => (
          <DelegateVerifierRow
            key={row.id}
            id={row.id}
            address={row.address}
            role={row.role}
            timestamp={row.timestamp}
            onRemove={removeRow}
            onRowChange={handleRowChange}
          />
        ))}
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.buttonPrimary}
          type="button"
          onClick={addRow}
        >
          Add Row
        </button>
        <button
          className={styles.buttonPrimary}
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
