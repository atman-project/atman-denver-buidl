import * as wasm from "hello-wasm-pack";
import * as Recrypt from "@ironcorelabs/recrypt-wasm-binding";
import aes from 'crypto-js/aes';
import WordArray from 'crypto-js/lib-typedarrays';
import CBC from 'crypto-js/mode-ctr';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import Utf8 from 'crypto-js/enc-utf8';

const aesKey = "aes key";
const originalData = "original data";

// Encrypt
const iv = WordArray.random(128 / 8);
// iv.toString(CryptoJS.env.Hex)
var ciphertext = aes.encrypt(originalData, aesKey, {
  mode: CBC,
  padding: Pkcs7,
  iv: iv,
}).toString();

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const userKeys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const paddedAESkey = addZeroPadding(new TextEncoder().encode(aesKey), 384);

//Encrypt the data to the user public key
const encryptedValue = Api256.encrypt(paddedAESkey, userKeys.publicKey, signingKeys.privateKey);

//Generate a second public/private key pair as the target of the transform. This will allow the encrypted data to be
//transformed to this second key pair and allow it to be decrypted.
const deviceKeys = Api256.generateKeyPair();

//Generate a transform key from the user private key to the device public key
const userToDeviceTransformKey = Api256.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, signingKeys.privateKey);

//Transform the encrypted data (without decrypting it!) so that it can be decrypted with the second key pair
const transformedEncryptedValue = Api256.transform(encryptedValue, userToDeviceTransformKey, signingKeys.privateKey);

//Decrypt the data using the second private key
const decryptedPaddedAESkey = Api256.decrypt(transformedEncryptedValue, deviceKeys.privateKey);
const decryptedAESKey = new TextDecoder().decode(decryptedPaddedAESkey.subarray(0, aesKey.length));

const decryptedData = aes.decrypt(ciphertext, decryptedAESKey, {
  iv: iv,
  mode: CBC,
  padding: Pkcs7,
}).toString(Utf8);
console.log(`decrypted: ${decryptedData}`);

function addZeroPadding(originalArray, targetLength) {
  if (originalArray.length > targetLength) {
    throw new Error(`data is too big: ${originalArray.length}`);
  }
  if (originalArray.length == targetLength) {
    return originalArray;
  }

  // Calculate the number of zeros to add
  const paddingLength = targetLength - originalArray.length;

  // Create a new array with the target length and fill it with zeros
  const paddedArray = new Uint8Array(targetLength);
  // Copy the original array contents into the start of the padded array
  paddedArray.set(originalArray, 0);
  // The rest of the paddedArray is automatically filled with zeros

  return paddedArray;
}
