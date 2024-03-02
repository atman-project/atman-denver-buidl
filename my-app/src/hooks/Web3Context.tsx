import { createContext, useEffect, useMemo, useState } from "react";

import { ethers } from "ethers";

export const Web3Context = createContext({
  provider: null,
  account: null,
  chainId: null,
  isActive: false,
  isPageLoaded: false,
  contractMetadata: { address: "", projectName: "", symbol: "" },
  connectWallet: () => {},
});

export function Web3ContextProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [contractMetadata, setContractMetadata] = useState({});

  async function checkIfWalletIsConnected() {
    const { ethereum } = window;
    if (!ethereum) return;

    const provider = new ethers.providers.Web3Provider(ethereum);
    setProvider(provider);

    const { chainId } = await provider.getNetwork();
    setChainId(chainId);

    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length) {
      setAccount(accounts[0]);
      setIsActive(true);
    }

    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xaa36a7" }]});
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    setIsPageLoaded(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      provider,
      account,
      chainId,
      isActive,
      isPageLoaded,
      contractMetadata,
      setContractMetadata,
      connectWallet: async () => {
        const { ethereum } = window;

        // request account
        await ethereum.request({ method: "eth_requestAccounts" });

        checkIfWalletIsConnected();
      },
    }),
    [provider, account, chainId, isActive, isPageLoaded, contractMetadata]
  );

  return (
    <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
  );
}
