"use client";

import { useMemo } from "react";
import { Contract } from "ethers";
import { useWeb3Context } from "./useWeb3Context";

function useContract({ address, ABI, signingEnabled = false }) {
  const { provider, isActive } = useWeb3Context();

  return useMemo(() => {
    if (!isActive || !provider || !address) return null;

    return new Contract(
      address,
      ABI,
      signingEnabled ? provider.getSigner() : provider
    );
  }, [address, ABI, signingEnabled, provider, isActive]);
}

export const useAtmanIssueContract = () => {
  const contractAddress = '0x971fb6e57d4c9991ea632d15b00a2b0c674d4d59';
  const contractABI = `[{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"dataEntries","outputs":[{"internalType":"string","name":"provider","type":"string"},{"internalType":"string","name":"ipfsHash","type":"string"},{"internalType":"address","name":"issuer","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_ipfsHash","type":"string"}],"name":"getPermissions","outputs":[{"components":[{"internalType":"address","name":"id","type":"address"},{"internalType":"enum AtmanOnchainSimulator.Permission","name":"permission","type":"uint8"},{"internalType":"uint256","name":"expiredAt","type":"uint256"}],"internalType":"struct AtmanOnchainSimulator.PermissionEntry[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_ipfsHash","type":"string"},{"internalType":"string","name":"_provider","type":"string"},{"internalType":"address","name":"_issuer","type":"address"},{"components":[{"internalType":"address","name":"id","type":"address"},{"internalType":"enum AtmanOnchainSimulator.Permission","name":"permission","type":"uint8"},{"internalType":"uint256","name":"expiredAt","type":"uint256"}],"internalType":"struct AtmanOnchainSimulator.PermissionEntry[]","name":"_permissions","type":"tuple[]"}],"name":"setDataEntry","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_ipfsHash","type":"string"},{"components":[{"internalType":"address","name":"id","type":"address"},{"internalType":"enum AtmanOnchainSimulator.Permission","name":"permission","type":"uint8"},{"internalType":"uint256","name":"expiredAt","type":"uint256"}],"internalType":"struct AtmanOnchainSimulator.PermissionEntry[]","name":"_permissions","type":"tuple[]"}],"name":"updatePermissions","outputs":[],"stateMutability":"nonpayable","type":"function"}]`;

  return useContract({
    address: contractAddress,
    ABI: contractABI,
    signingEnabled: true,
  });
}

export const useIdentityStorageContract = () => {
  const contractAddress = '0x49AE43593fD005a6998F92b89cAcaF7055b23f47';
  const contractABI = `[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"string","name":"publicKeyBase64","type":"string"}],"name":"IdentitySet","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"getIdentity","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"publicKeyBase64","type":"string"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"setIdentity","outputs":[],"stateMutability":"nonpayable","type":"function"}]`;

  return useContract({
    address: contractAddress,
    ABI: contractABI,
    signingEnabled: true,
  });
}
