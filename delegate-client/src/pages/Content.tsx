import React, { useEffect } from 'react';
import { fetchIPFSData, reencrypt, decrypt, removeZeroPadding, aesDecrypt, AES_KEY_SIZE, base64ToUint8Array } from '../Encryption';

const Content = ({ cid }) => {
  const [content, setContent] = React.useState('');
  const [signature, setSignature] = React.useState('');

  useEffect(() => {
    async function loadData() {
      let bnPrivateKey = base64ToUint8Array(localStorage.getItem("sk")!);
      let ipfsData = await fetchIPFSData(cid);
      const encryptedDataWithIv: Uint8Array = ipfsData.data;
      const {
        encrypted,
        reencryptionKeys,
        signingPrivateKey,
      } = ipfsData.pre;

      //TODO: handle multiple reencryption keys properly
      let reencryptedAESKey = await reencrypt(encrypted, reencryptionKeys[0], signingPrivateKey);
      let decryptedAESKeyPadded = await decrypt(reencryptedAESKey, bnPrivateKey);
      const decryptedAESKey = removeZeroPadding(decryptedAESKeyPadded, AES_KEY_SIZE);
      const decrypted = JSON.parse(aesDecrypt(encryptedDataWithIv, decryptedAESKey));

      setContent(decrypted.content);
      setSignature(decrypted.signature);
    }

    loadData();
  }, [cid]);

  return (
    <>
      <main className="container mx-auto flex flex-col px-8 py-16">
        <p>[Data]</p>
        <p id="content" style={{ maxWidth: '500px', wordWrap: 'break-word' }}>{content}</p>
        <br></br>
        <p>[Data Issuer Signature]</p>
        <p id="signature" style={{ maxWidth: '500px', wordWrap: 'break-word' }}>{signature}</p>
      </main>
    </>
  );
};

export default Content;
