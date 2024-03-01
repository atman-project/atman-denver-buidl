'use client';
import React, { useCallback } from 'react';

import * as Recrypt from "@ironcorelabs/recrypt-wasm-binding";
import aes from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import WordArray from 'crypto-js/lib-typedarrays';
import CBC from 'crypto-js/mode-ctr';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import Header from '@/components/layout/header/Header';

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function HomePage() {
  const [text, setText] = React.useState('');
  const [output, setOutput] = React.useState('');

  const aesEncrpyt = (plaintext: string, key: WordArray): string => {
    const iv = WordArray.random(128 / 8);
    const ciphertext = aes.encrypt(plaintext, key, {
      mode: CBC,
      padding: Pkcs7,
      iv: iv,
    }).toString();
    return iv.toString() + ciphertext;
  }

  const addZeroPadding = (data: Uint8Array, targetLen: number): Uint8Array => {
    if (data.length > targetLen) {
      throw new Error(`data is too big: ${data.length}`);
    }
    if (data.length == targetLen) {
      return data;
    }

    const paddedArray = new Uint8Array(targetLen);
    paddedArray.set(data, 0);
    return paddedArray;
  }

  const processText = useCallback(() => {
    const aesKey = WordArray.random(128 / 8);
    const ciphertextWithIv = aesEncrpyt(text, aesKey);

    // Create a new Recrypt API instance
    const Api256 = new Recrypt.Api256();

    // Generate both a user key pair and a signing key pair
    // TODO: should be provided from somewhere else
    const bnKeyPair = Api256.generateKeyPair();
    const signingKeys = Api256.generateEd25519KeyPair();

    // Encrypt the AES key
    const paddedAESkey = addZeroPadding(new TextEncoder().encode(aesKey.toString()), 384);
    const encryptedAESKey = Api256.encrypt(paddedAESkey, bnKeyPair.publicKey, signingKeys.privateKey);

    // TODO: should be provided from somewhere else
    const verifierBNKeyPair = Api256.generateKeyPair();
    const reencryptionKey = Api256.generateTransformKey(bnKeyPair.privateKey, verifierBNKeyPair.publicKey, signingKeys.privateKey);

    const outputData = {
      data: ciphertextWithIv,
      encryptedAESKey: encryptedAESKey,
      reencryptionKey: reencryptionKey,
    };

    // Process the text and set the output
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
