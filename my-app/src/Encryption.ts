import aes from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import WordArray from 'crypto-js/lib-typedarrays';
import CBC from 'crypto-js/mode-ctr';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import * as ipfsClient from 'ipfs-http-client';

export const uint8ArrayToBase64 = (uint8Array) => {
  return btoa(String.fromCharCode.apply(null, uint8Array));
}

export const base64ToUint8Array = (base64) => {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// Recursive function to encode objects, including Uint8Arrays, to a JSON-friendly format
export const encodeObject = (obj) => {
  if (obj instanceof Uint8Array) {
    return { _type: 'Uint8Array', data: uint8ArrayToBase64(obj) };
  } else if (Array.isArray(obj)) {
    return obj.map(encodeObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const encoded = {};
    for (const [key, value] of Object.entries(obj)) {
      encoded[key] = encodeObject(value);
    }
    return encoded;
  }
  return obj;
}

// Recursive function to decode objects, including Base64 strings back to Uint8Arrays
export function decodeObject(obj) {
  if (obj && typeof obj === 'object') {
    if (obj._type === 'Uint8Array' && typeof obj.data === 'string') {
      return base64ToUint8Array(obj.data);
    } else {
      for (const key of Object.keys(obj)) {
        obj[key] = decodeObject(obj[key]);
      }
    }
  }
  return obj;
}

export const aesEncrpyt = (plaintext: string, key: string): string => {
  const iv = "myiv";
  const ciphertext = aes.encrypt(plaintext, key, {
    mode: CBC,
    padding: Pkcs7,
    iv: WordArray.create(new TextEncoder().encode(iv)),
  }).toString();
  return iv + ciphertext;
}

export const addZeroPadding = (data: string, targetLen: number): string => {
  if (data.length > targetLen) {
    throw new Error(`data is too big: ${data.length}`);
  }
  if (data.length == targetLen) {
    return data;
  }

  return data + '0'.repeat(targetLen - data.length);
}

export const pre = async (data: string) => {
  const recrypt = await import("@ironcorelabs/recrypt-wasm-binding");
  // Create a new Recrypt API instance
  const Api256 = new recrypt.Api256();

  // Generate both a user key pair and a signing key pair
  // TODO: should be provided from somewhere else
  const bnKeyPair = Api256.generateKeyPair();
  const signingKeys = Api256.generateEd25519KeyPair();

  // Encrypt the AES key
  const paddedAESkey = new TextEncoder().encode(addZeroPadding(data, 384));
  const encryptedAESKey = Api256.encrypt(paddedAESkey, bnKeyPair.publicKey, signingKeys.privateKey);

  // TODO: should be provided from somewhere else
  const verifierBNKeyPair = Api256.generateKeyPair();
  const reencryptionKey = Api256.generateTransformKey(bnKeyPair.privateKey, verifierBNKeyPair.publicKey, signingKeys.privateKey);

  return {
    encrypted: encryptedAESKey,
    reencryptionKey: reencryptionKey,
    signingPrivateKey: signingKeys.privateKey,
    verifierBNPrivateKey: verifierBNKeyPair.privateKey, //TODO: remove this
  };
};

export const uploadToIPFS = async (data: string): Promise<string> => {
  const ipfs = ipfsClient.create({ url: 'http://localhost:5001' });

  // Test the connection
  const version = await ipfs.version();
  console.log('Connected to IPFS node: version:', version.version);

  // Example: Add a file to IPFS
  const { cid } = await ipfs.add(data);
  console.log('Added file CID:', cid.toString());
  return cid.toString();
}

export const aesDecrypt = (ciphertextWithIv: string, key: string): string => {
  const iv = ciphertextWithIv.substring(0, "myiv".length);
  const ciphertext = ciphertextWithIv.substring("myiv".length);
  return aes.decrypt(ciphertext, key, {
    mode: CBC,
    padding: Pkcs7,
    iv: WordArray.create(new TextEncoder().encode(iv)),
  }).toString(Utf8);
}

export const removeZeroPadding = (data: Uint8Array, targetLen: number): Uint8Array => {
  if (data.length < targetLen) {
    throw new Error(`data is too short: ${data.length}`);
  }
  return data.subarray(0, targetLen);
}

export const fetchIPFSData = async (cid: string) => {
  const ipfs = ipfsClient.create({ url: 'http://localhost:5001' });

  // Test the connection
  const version = await ipfs.version();
  console.log('Connected to IPFS node: version:', version.version);

  const stream = ipfs.cat(cid);
  let data = '';
  for await (const chunk of stream) {
    data += new TextDecoder().decode(chunk);
  }
  console.log(data);
  return decodeObject(JSON.parse(data));
}

export const reencrypt = async (ciphertext: EncryptedValue, reencryptionKey: TransformKey, signingPrivateKey: Uint8Array) => {
  const recrypt = await import("@ironcorelabs/recrypt-wasm-binding");

  // Create a new Recrypt API instance
  const Api256 = new recrypt.Api256();
  return Api256.transform(ciphertext, reencryptionKey, signingPrivateKey);
}

export const decrypt = async (reencrypted: EncryptedValue, privateKey: Uint8Array) => {
  const recrypt = await import("@ironcorelabs/recrypt-wasm-binding");

  // Create a new Recrypt API instance
  const Api256 = new recrypt.Api256();
  return Api256.decrypt(reencrypted, privateKey);
}
