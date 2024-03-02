import React from "react";
import { useWeb3Context } from "../hooks/useWeb3Context";

export function Header() {
  const { connectWallet, account } = useWeb3Context();
  
  return (
    <header>
      <h1>Delegate</h1>
      <button type="button" onClick={connectWallet}>Connect Wallet</button>
      <p>{account}</p>
    </header>
  )
};