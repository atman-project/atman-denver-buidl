import React, { useCallback, useEffect } from 'react';
import { fetchIPFSData, reencrypt, decrypt, removeZeroPadding, aesDecrypt } from '../Encryption';

const Content = ({ cid }) => {
  const [output, setOutput] = React.useState('');

  useEffect(() => {
    async function loadData() {
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
