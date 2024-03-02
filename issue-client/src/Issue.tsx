import { useCallback, useState } from "react";
import { aesEncrpyt, pre, uploadToIPFS, encodeObject, generateAESKey, generateBNKeyPair, encodeBNKeyPair, decodeBNPublicKey } from "./Encryption";
import { useWeb3Context } from "./hooks/useWeb3Context";
import { useAtmanIssueContract, useIdentityStorageContract } from "./hooks/useContract";
import React from "react";
import DelegateVerifierRow, { Permission, Role } from "./components/DelegateVerifierEntry";
import styles from "./Issue.module.css";
import { Contract } from "ethers";

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

  async function encryptAndUploadContent(content: string, account: string, rows: Permission[]) {
    // @ts-ignore
    const { ethereum } = window;
    const signature = await ethereum.request({ method: 'personal_sign', params: [content, account] });
    setSignature(signature);

    const data = JSON.stringify({ content, signature }) as string;

    const aesKey = generateAESKey();
    const ciphertextWithIv = aesEncrpyt(data, aesKey);

    const bnKeyPair = await generateBNKeyPair();
    const encodedBNKeyPair = encodeBNKeyPair(bnKeyPair);

    const receiverPublicKeys = await Promise.all(rows.filter((row) => row.role === "verifier").map(async (row) => {
      const result = await identityContract!.functions.getIdentity(row.address);
      const publicKeyBase64 = result[0];
      return decodeBNPublicKey(publicKeyBase64);
    }));
    const preResult = await pre(aesKey, bnKeyPair, receiverPublicKeys);

    const dataToBeUploaded = {
      data: ciphertextWithIv,
      pre: preResult,
    };
    const cid = await uploadToIPFS(
      JSON.stringify(encodeObject(dataToBeUploaded))
    );

    return {
      cid: cid,
      encodedBNKeyPair: encodedBNKeyPair,
    };
  }

  function convertPermissions(rows: Permission[]) {
    return rows.map((row) => {
      return {
        id: row.address,
        permission: row.role === 'delegate' ? 0 : 1,
        expiredAt: row.timestamp,
      };
    });
  }

  async function execSetDataEntry(cid: string, account: string, rows: Permission[], atmanIssueContract: Contract): Promise<string> {
    const permissions = convertPermissions(rows);
    const { hash } = await atmanIssueContract.functions.setDataEntry(
      cid,
      'IPFS',
      account,
      permissions
    );
    console.log(`hash:${hash}`);
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }

  async function execUpdatePermissions(cid: string, rows: Permission[], atmanIssueContract: Contract): Promise<string> {
    const permissions = convertPermissions(rows);
    const { hash } = await atmanIssueContract.functions.updatePermissions(
      cid,
      permissions
    );
    console.log(`hash:${hash}`);
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }

  const issueContent = useCallback(async () => {
    const { cid, encodedBNKeyPair } = await encryptAndUploadContent(text, account!, rows);
    setCid(cid);

    const identityResult = await identityContract!.functions.setIdentity(encodedBNKeyPair.publicKey, "0xab");
    console.log(`IDENTITY: https://sepolia.etherscan.io/tx/${identityResult.hash}`);

    const ethscanUrl = await execSetDataEntry(cid, account!, rows, atmanIssueContract!);
    setOutput(ethscanUrl);
  }, [text, account, atmanIssueContract, identityContract, rows]);

  const updatePermissions = useCallback(async () => {
    console.log(`cid:${cid}, account:${account}`);
    console.log(rows);
    const ethscanUrl = await execUpdatePermissions(cid, rows, atmanIssueContract!);
    setOutput(ethscanUrl);
  }, [cid, atmanIssueContract, rows]);

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
        <button
          className={styles.buttonPrimary}
          type="button"
          onClick={updatePermissions}
        >
          Update Permissions
        </button>
      </div>
      <p id="output">{output}</p>
    </div>
  );
}
