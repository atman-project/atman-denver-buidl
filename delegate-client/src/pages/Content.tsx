import React, { useEffect } from 'react';
import { fetchIPFSData, reencrypt, decrypt, removeZeroPadding, aesDecrypt, AES_KEY_SIZE, base64ToUint8Array } from '../Encryption';
import { useAtmanIssueContract } from '@/hooks/useContract';
import { useWeb3Context } from '@/hooks/useWeb3Context';

const Permission = {
  DELEGATEE: 0,
  VERIFIER: 1,
};

const Content = ({ cid }) => {
  const [content, setContent] = React.useState('');
  const [signature, setSignature] = React.useState('');
  const { account } = useWeb3Context();
  const permissionContract = useAtmanIssueContract();

  function checkVerifierPermission(account: string, permissions: any[][]): number {
    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      if (permission[0].toUpperCase() === account.toUpperCase() && permission[1] == Permission.VERIFIER) {
        return i;
      }
    }
    return -1;
  }

  useEffect(() => {
    async function loadData() {
      if (permissionContract === null) {
        console.log("permissionContract is null");
        return;
      } else if (account === null) {
        console.log("account is null");
        return;
      }

      // authentication
      const permissionsResult = await permissionContract!.functions.getPermissions(cid);
      const permissionIdx = checkVerifierPermission(account!, permissionsResult[0]);
      if (permissionIdx == -1) {
        setContent("Not Allowed");
        setSignature("");
        return;
      }

      let bnPrivateKey = base64ToUint8Array(localStorage.getItem("sk")!);
      let ipfsData = await fetchIPFSData(cid);
      const encryptedDataWithIv: Uint8Array = ipfsData.data;
      const {
        encrypted,
        reencryptionKeys,
        signingPrivateKey,
      } = ipfsData.pre;

      try {
        let reencryptedAESKey = await reencrypt(encrypted, reencryptionKeys[permissionIdx], signingPrivateKey);
        let decryptedAESKeyPadded = await decrypt(reencryptedAESKey, bnPrivateKey);
        const decryptedAESKey = removeZeroPadding(decryptedAESKeyPadded, AES_KEY_SIZE);
        const decrypted = JSON.parse(aesDecrypt(encryptedDataWithIv, decryptedAESKey));

        setContent(decrypted.content);
        setSignature(decrypted.signature);
      } catch (_) {
        setContent("Decryption Failed");
        setSignature("");
      }
    }

    loadData();
  }, [cid, permissionContract]);

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
