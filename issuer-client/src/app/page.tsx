"use client"; 

import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { Web3Provider } from "@coinbase/wallet-sdk/dist/provider/Web3Provider";
import React from "react";

export default function Page() {
  const [address, setAddress] = React.useState('');
  const [provider, setProvider] = React.useState<Web3Provider | null>(null);
  const [text, setText] = React.useState('');
  const [output, setOutput] = React.useState('');

  

  const connectWallet = async () => {
    const wallet = new CoinbaseWalletSDK({
      appName: 'Atman Issuer',
    });
    const provider = await wallet.makeWeb3Provider();
    setProvider(provider);

    const addresses = await provider.request({ method: 'eth_requestAccounts' }) as string[];
    const walletAddress = addresses[0];
    setAddress(walletAddress);
  };

  const processText = () => {
    // Process the text and set the output
    const processedText = text.toUpperCase(); // Example processing
    setOutput(processedText);
  };

  return (
    <div>
      <div>
        <h1>Atman Content Issuer PoC</h1>
        <button onClick={connectWallet}>Connect Wallet</button>
        {address && <p>Wallet Address: {address}</p>}
      </div>
      <div>
        <h2>Issue data</h2>
        <input
          id="textInput"
          type="text"
          placeholder="Enter text here"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button id="processBtn" onClick={processText}>
          Issue
        </button>
        <p id="output">{output}</p>
      </div>
    </div>
  );
}
