'use client';
import React, { useCallback } from 'react';

// import * as Recrypt from "@ironcorelabs/recrypt-wasm-binding";

import Header from '@/components/layout/header/Header';

import { fetchIPFSData, reencrypt, decrypt, removeZeroPadding, aesDecrypt } from './Encryption';

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function HomePage() {
  const [cid, setText] = React.useState('');
  const [output, setOutput] = React.useState('');

  const processCID = useCallback(async () => {
    let ipfsData = await fetchIPFSData(cid);
    const encryptedDataWithIv: string = ipfsData.data;
    const {
      encrypted,
      reencryptionKey,
      signingPrivateKey,
      verifierBNPrivateKey,
    } = ipfsData.pre;

    // TODO: remove this part. only for testing
    let reencryptedAESKey = await reencrypt(encrypted, reencryptionKey, signingPrivateKey);
    let decryptedAESKeyPadded = await decrypt(reencryptedAESKey, verifierBNPrivateKey);
    const decryptedAESKey = new TextDecoder().decode(removeZeroPadding(decryptedAESKeyPadded, "mykey".length));
    const decryptedData = aesDecrypt(encryptedDataWithIv, decryptedAESKey);

    setOutput(decryptedData);
  }, [cid]);

  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col px-8 py-16">
        <h2>Process encrypted data by fetching it from IPFS</h2>
        <input
          id="textInput"
          type="text"
          placeholder="Enter IPFS CID here"
          value={cid}
          onChange={(e) => setText(e.target.value)}
        />
        <button id="processBtn" type="button" onClick={processCID}>
          Process
        </button>
        <p id="output">{output}</p>
      </main>
    </>
  );
}
