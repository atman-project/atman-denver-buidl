import React, { useState, useEffect } from 'react';
import { encodeBNKeyPair, generateBNKeyPair, uint8ArrayToBase64 } from '../Encryption';
import { useIdentityStorageContract } from '@/hooks/useContract';

const Root = () => {
  const [cid, setCid] = useState('');
  const identityContract = useIdentityStorageContract();

  useEffect(() => {
    async function generateAndRegisterIdentity() {
      if (identityContract === null) {
        console.log("identityContract is null");
        return;
      }

      const bnKeyPair = await generateBNKeyPair();
      const encodedBNKeyPair = encodeBNKeyPair(bnKeyPair);
      const identityResult = await identityContract!.functions.setIdentity(encodedBNKeyPair.publicKey, "0xab");
      console.log(`IDENTITY: https://sepolia.etherscan.io/tx/${identityResult.hash}`);

      localStorage.setItem("sk", uint8ArrayToBase64(bnKeyPair.privateKey));
    }

    generateAndRegisterIdentity();
  }, [identityContract]);

  const handleInputChange = (e) => {
    setCid(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Redirect to the same domain with the CID as a query parameter
      window.location.href = `${window.location.origin}?cid=${cid}`;
    }
  };

  return (
    <div>
      <input
        type="text"
        value={cid}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter CID"
      />
    </div>
  );
};

export default Root;
