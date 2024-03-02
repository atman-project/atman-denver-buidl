import { EncryptedValue, TransformKey } from '@ironcorelabs/recrypt-wasm-binding';
import aes from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import WordArray from 'crypto-js/lib-typedarrays';
import CBC from 'crypto-js/mode-ctr';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import { create as ipfsCreate } from 'ipfs-http-client';

export const IV_SIZE = 16;
export const AES_KEY_SIZE = 16;

function wordArrayToUint8Array(wa: WordArray): Uint8Array {
  const len = wa.sigBytes;
  const words = wa.words;
  const result = new Uint8Array(len);

  let i = 0; // Index for the result array
  let j = 0; // Index for the word array

  while (true) {
    // Convert each word (4 bytes) into Uint8Array values
    result[i++] = (words[j] >> 24) & 0xff;
    if (i === len) break;
    result[i++] = (words[j] >> 16) & 0xff;
    if (i === len) break;
    result[i++] = (words[j] >> 8) & 0xff;
    if (i === len) break;
    result[i++] = words[j] & 0xff;
    if (i === len) break;

    j++;
  }

  return result;
}

function concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

export function generateAESKey(): Uint8Array {
  return wordArrayToUint8Array(WordArray.random(AES_KEY_SIZE));
}

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

export const aesEncrpyt = (plaintext: string, key: Uint8Array): Uint8Array => {
  const iv = WordArray.random(IV_SIZE);
  const ciphertext = aes.encrypt(plaintext, WordArray.create(key), {
    mode: CBC,
    padding: Pkcs7,
    iv: iv,
  }).toString();

  return concatUint8Array(wordArrayToUint8Array(iv), new TextEncoder().encode(ciphertext));
}

export const aesDecrypt = (ciphertextWithIv: Uint8Array, key: Uint8Array): Uint8Array => {
  const iv = WordArray.create(ciphertextWithIv.subarray(0, IV_SIZE));
  const ciphertext = new TextDecoder().decode(ciphertextWithIv.subarray(IV_SIZE));
  return aes.decrypt(ciphertext, WordArray.create(key), {
    mode: CBC,
    padding: Pkcs7,
    iv: iv,
  }).toString(Utf8);
}

export const addZeroPadding = (data: Uint8Array, targetLen: number): Uint8Array => {
  if (data.length > targetLen) {
    throw new Error(`data is too big: ${data.length}`);
  }
  if (data.length == targetLen) {
    return data;
  }

  const paddedArray = new Uint8Array(targetLen);
  paddedArray.set(data, 0);
  return paddedArray;
}

export const removeZeroPadding = (data: Uint8Array, targetLen: number): Uint8Array => {
  if (data.length < targetLen) {
    throw new Error(`data is too short: ${data.length}`);
  }
  return data.subarray(0, targetLen);
}

export async function generateBNKeyPair() {
  const recrypt = await import("@ironcorelabs/recrypt-wasm-binding");
  // Create a new Recrypt API instance
  const Api256 = new recrypt.Api256();
  return Api256.generateKeyPair();
}

export function encodeBNKeyPair(keypair) {
  return {
    privateKey: uint8ArrayToBase64(keypair.privateKey),
    publicKey: uint8ArrayToBase64(keypair.publicKey.x) + uint8ArrayToBase64(keypair.publicKey.y),
  };
}

export function decodeBNKeyPair(privateKey: string, publicKey: string) {
  return {
    privateKey: base64ToUint8Array(privateKey),
    publicKey: decodeBNPublicKey(publicKey),
  };
}

export function decodeBNPublicKey(publicKey: string) {
  return {
    x: base64ToUint8Array(publicKey.substring(0, 44)),
    y: base64ToUint8Array(publicKey.substring(44)),
  };
}

export const pre = async (data: Uint8Array, senderBNKeyPair, receiverBNPublicKey) => {
  const recrypt = await import("@ironcorelabs/recrypt-wasm-binding");
  // Create a new Recrypt API instance
  const Api256 = new recrypt.Api256();

  // console.log(`bn_sk: ${uint8ArrayToBase64(bnKeyPair.privateKey)}`);
  // console.log(`bn_pk_x: ${uint8ArrayToBase64(bnKeyPair.publicKey.x)}`);
  // console.log(`bn_pk_y: ${uint8ArrayToBase64(bnKeyPair.publicKey.y)}`);
  const signingKeys = Api256.generateEd25519KeyPair();

  // Encrypt the AES key
  const paddedAESkey = addZeroPadding(data, 384);
  const encryptedAESKey = Api256.encrypt(paddedAESkey, senderBNKeyPair.publicKey, signingKeys.privateKey);

  // console.log(`bn_v_sk: ${uint8ArrayToBase64(verifierBNKeyPair.privateKey)}`);
  // console.log(`bn_v_pk_x: ${uint8ArrayToBase64(verifierBNKeyPair.publicKey.x)}`);
  // console.log(`bn_v_pk_y: ${uint8ArrayToBase64(verifierBNKeyPair.publicKey.y)}`);
  const reencryptionKey = Api256.generateTransformKey(senderBNKeyPair.privateKey, receiverBNPublicKey, signingKeys.privateKey);

  return {
    encrypted: encryptedAESKey,
    reencryptionKey: reencryptionKey,
    signingPrivateKey: signingKeys.privateKey,
  };
};

export const uploadToIPFS = async (data: string): Promise<string> => {
  const ipfs = ipfsCreate({ url: 'http://localhost:5001' });

  // Test the connection
  const version = await ipfs.version();
  console.log('Connected to IPFS node: version:', version.version);

  // Example: Add a file to IPFS
  const { cid } = await ipfs.add(data);
  console.log('Added file CID:', cid.toString());
  return cid.toString();
}

export const fetchIPFSData = async (cid: string) => {
  const ipfs = ipfsCreate({ url: 'http://localhost:5001' });

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
