import React, { useCallback, useEffect } from 'react';
import { fetchIPFSData, reencrypt, decrypt, removeZeroPadding, aesDecrypt, AES_KEY_SIZE } from '../Encryption';

const Content = ({ cid }) => {
  const [output, setOutput] = React.useState('');

  useEffect(() => {
    async function loadData() {
      let ipfsData = await fetchIPFSData(cid);
      const encryptedDataWithIv: Uint8Array = ipfsData.data;
      const {
        encrypted,
        reencryptionKey,
        signingPrivateKey,
        verifierBNPrivateKey,
      } = ipfsData.pre;

      let reencryptedAESKey = await reencrypt(encrypted, reencryptionKey, signingPrivateKey);
      let decryptedAESKeyPadded = await decrypt(reencryptedAESKey, verifierBNPrivateKey);
      const decryptedAESKey = removeZeroPadding(decryptedAESKeyPadded, AES_KEY_SIZE);
      const decryptedData = aesDecrypt(encryptedDataWithIv, decryptedAESKey);

      setOutput(decryptedData);
    }
    loadData();
  }, [cid]);

  return (
    <>
      <main className="container mx-auto flex flex-col px-8 py-16">
        <h2>Process encrypted data by fetching it from IPFS</h2>
        <p id="output">{output}</p>
      </main>
    </>
  );
};

export default Content;
