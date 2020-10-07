# celo-ethers-wrapper

A minimal wrapper to make Ethers.JS compatible with the Celo network.

_Note: this is still an early experimental version_

## Install

`npm i @celo-tools/celo-ethers-wrapper` or `yarn add @celo-tools/celo-ethers-wrapper`

Note this wrapper has Ethers v5 as a peer dependency. Your project must include a dependency on that as well.

## Example

Connect to the network by creating a `CeloProvider`, which is based on [JsonRpc-Provider](https://docs.ethers.io/v5/api/providers/jsonrpc-provider/):

```js
import { CeloProvider } from '@celo-tools/celo-ethers-wrapper'

// Connecting to Alfajores testnet
const provider = new CeloProvider('https://alfajores-forno.celo-testnet.org')
await provider.ready
```

Create a CeloWallet, which is based on [Wallet](https://docs.ethers.io/v5/api/signer/#Wallet) :

```js
import { CeloWallet } from '@celo-tools/celo-ethers-wrapper'

const wallet = new CeloWallet(YOUR_PK, provider)
```

Use the provider or wallet to make calls or send transactions:

```js
const txResponse = await wallet.sendTransaction({
    to: recipient,
    value: amountInWei,
    gasPrice: 500000000,
    gasLimit: 10000000,
    // gatewayFeeRecipient: '0x8c2a2c7a71c68f30c1ec8940a1efe72c06d8f32f',
    // gasCurrency: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
  })
  const txReceipt = await txResponse.wait()
  console.info(`CELO transaction hash received: ${txReceipt.transactionHash}`)
```
