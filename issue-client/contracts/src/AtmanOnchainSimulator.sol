// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AtmanOnchainSimulator {
    enum Permission { Delegatee, Verifier }

    struct PermissionEntry {
        address id;
        Permission permission;
        uint256 expiredAt;
    }

    struct DataEntry {
        string provider;
        string ipfsHash;
        address issuer;
        PermissionEntry[] permissions;
    }

    mapping(string => DataEntry) public dataEntries;

    modifier onlyIssuer(string memory _ipfsHash) {
        require(msg.sender == dataEntries[_ipfsHash].issuer, "Only the issuer can update permissions");
        _;
    }

    function setDataEntry(
        string memory _ipfsHash,
        string memory _provider,
        address _issuer,
        PermissionEntry[] memory _permissions
    ) public {
        DataEntry storage entry = dataEntries[_ipfsHash];
        entry.provider = _provider;
        entry.ipfsHash = _ipfsHash;
        entry.issuer = _issuer;
        for (uint i = 0; i < _permissions.length; i++) {
            entry.permissions.push(_permissions[i]);
        }
    }

    function updatePermissions(string memory _ipfsHash, PermissionEntry[] memory _permissions) public onlyIssuer(_ipfsHash) {
        DataEntry storage entry = dataEntries[_ipfsHash];
        delete entry.permissions;
        for (uint i = 0; i < _permissions.length; i++) {
            entry.permissions.push(_permissions[i]);
        }
    }

    function getPermissions(string memory _ipfsHash) public view returns (PermissionEntry[] memory) {
        return dataEntries[_ipfsHash].permissions;
    }
}
