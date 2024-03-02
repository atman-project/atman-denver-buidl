'use client';
import React, { useCallback } from 'react';

// import * as Recrypt from "@ironcorelabs/recrypt-wasm-binding";

import Header from '@/components/layout/header/Header';

import { aesEncrpyt, pre, uploadToIPFS, encodeObject } from './Encryption';

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function HomePage() {
  const [text, setText] = React.useState('');
  const [output, setOutput] = React.useState('');

  const processText = useCallback(async () => {
    const aesKey = "mykey";
    console.log(`AES: ${aesKey}`);
    const ciphertextWithIv = aesEncrpyt(text, aesKey);

    const preResult = await pre(aesKey.toString());

    const dataToBeUploaded = {
      data: ciphertextWithIv,
      pre: preResult,
    };
    const cid = await uploadToIPFS(JSON.stringify(encodeObject(dataToBeUploaded)));

    const outputData = {
      cid: cid,
      data: dataToBeUploaded,
    }
    setOutput(JSON.stringify(outputData));
  }, [text]);

  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col px-8 py-16">
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
      </main>
    </>
  );
}
