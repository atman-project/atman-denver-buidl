# Atman PoC

NOTE: This PoC spec doesn't desribe the optimal full spec.

## Demo Components

- Issuer client: Web
- Publisher service: Web
- Meta store / PKI: Ethereum
- Data channel: IPFS


## Flow 

### Issuer client
- Do C2PA
    - But, only with issuer signature for now
    - Signing body
        ```
        {
            "issuer": "aslkdjfdaflkjsl",
            "data": "lkfjewqrewr"
        }
        ```
    - Signed data
        ```
        {
            "issuer": "aslkdjfdaflkjsl",
            "data": "lkfjewqrewr",
            "signature": "eqoijeqroiejqroijewqroij"
        }
        ```
- Setup Proxy Re-encryption + Threshold Encryption for the `Signed data`
    - Output (per delegatee)
        - Encrypted data: `A'`
        - Re-encryption key: `K` 
- Store the set of `A'` and `K` on IPFS
- Store permissions on Ethereum
    ```json
    {
        "data": {
            "provider": "IPFS"
            "id": "lkfjeqlkrjeqrlkj",
        },
        "issuer": "aslkdjfdaflkjsl",
        "permissions": [
            {
                "id": "ewqoirjqoiwrjoqjroijoiqjeroijq",
                "permission": "Delegatee",
                "expired_at": "1111-11-11"
            },
            {
                "id": "poieqrjpojoijpjtrt",
                "permission": "Verifier",
                "expired_at": "1111-11-11"
            },
            {
                "id": "biojoiewjo",
                "permission": "Verifier",
                "expired_at": "1111-11-11"
            }
       ]
    }
    ```
    - Why on chain?
        - Interoperability: Supporting multiple data publishers with minimal interactions
        - Minimizied trust with data publisher
        - Anyone should be able to verify the data lifecycle.
            - Mutation history: Data + Permissions

### Publisher service
- Monitor permissions from Ethereum to find data to be published by them
- When any verifier requests the data presentation,
    - Re-encrypt `A'` into `A*`, and show it to the verifier.
