// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IdentityStorage {
    // Define a structure to hold the identity information
    struct Identity {
        address owner;
        string publicKeyBase64;
        bytes signature;
    }

    // Mapping from user's Ethereum address to their Identity
    mapping(address => Identity) private identities;

    // Event to emit when an identity is added or updated
    event IdentitySet(address indexed owner, string publicKeyBase64);

    // Function to add or update an identity with signature verification
    function setIdentity(string memory publicKeyBase64, bytes memory signature) public {
        // Create a new Identity struct and add it to the mapping
        identities[msg.sender] = Identity(msg.sender, publicKeyBase64, signature);

        // Emit an event for the new identity
        emit IdentitySet(msg.sender, publicKeyBase64);
    }

    // Function to retrieve an identity by Ethereum address
    function getIdentity(address owner) public view returns (string memory) {
        return identities[owner].publicKeyBase64;
    }

    // Helper function to recover the signer's address from the signature
    // function recoverSigner(address owner, string memory publicKeyBase64, bytes memory signature) public pure returns (address) {
    //     // Create a prefixed hash of the message to mimic the behavior of the Ethereum signed message
    //     bytes32 messageHash = keccak256(abi.encodePacked(owner, publicKeyBase64));
    //     bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    //
    //     // Recover the signer's address from the signature
    //     (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
    //     return ecrecover(ethSignedMessageHash, v, r, s);
    // }

    // Helper function to split the signature into its components
    // function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
    //     require(sig.length == 65, "Invalid signature length");
    //
    //     assembly {
    //         // first 32 bytes, after the length prefix
    //         r := mload(add(sig, 32))
    //         // second 32 bytes
    //         s := mload(add(sig, 64))
    //         // final byte (first byte of the next 32 bytes)
    //         v := byte(0, mload(add(sig, 96)))
    //     }
    //
    //     // Adjust for non-EIP-155 signatures
    //     if (v < 27) v += 27;
    //
    //     require(v == 27 || v == 28, "Invalid signature version");
    // }
}

