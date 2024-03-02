import { useCallback, useState } from "react";
import { aesEncrpyt, pre, uploadToIPFS, encodeObject, generateAESKey, generateBNKeyPair } from "./Encryption";
import { useWeb3Context } from "./hooks/useWeb3Context";
import { useAtmanIssueContract } from "./hooks/useContract";
import React from "react";

export function Issue() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const { connectWallet, account } = useWeb3Context();
  const contract = useAtmanIssueContract();

  const processText = useCallback(async () => {
    const aesKey = generateAESKey();
    const ciphertextWithIv = aesEncrpyt(text, aesKey);

    const bnKeyPair = await generateBNKeyPair();
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

    const { hash } = await contract!.functions.setDataEntry(
      cid,
      'IPFS',
      account!,
      []
    );

    const ethscanUrl = `https://sepolia.etherscan.io/tx/${hash}`;
    setOutput(ethscanUrl);

  }, [text, account, contract]);

  return (
    <div>
      <h2>Issue data</h2>
      <input
        id="textInput"
        type="text"
        placeholder="Enter text here"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button id="processBtn" type="button" onClick={processText}>
        Issue
      </button>
      <p id="output">{output}</p>
    </div>
  );
}
