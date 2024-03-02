import { useCallback, useState } from "react";
import { aesEncrpyt, pre, uploadToIPFS, encodeObject } from "../Encryption";
import { useWeb3Context } from "@/hooks/useWeb3Context";

export function Issue() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const { connectWallet } = useWeb3Context();

  const processText = useCallback(async () => {
    const aesKey = "mykey";
    console.log(`AES: ${aesKey}`);
    const ciphertextWithIv = aesEncrpyt(text, aesKey);

    const preResult = await pre(aesKey.toString());

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
    setOutput(JSON.stringify(outputData));
  }, [text]);

  return (
    <>
      <button type="button" onClick={connectWallet}>Connect Wallet</button>
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
    </>
  );
}
