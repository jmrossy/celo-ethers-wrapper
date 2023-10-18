# celo-ethers-wrapper

Initially, the Celo network was not fully compatible with Ethers.JS. Since the Donut hard-fork in 2021, Ethereum tools can now be used with Celo without the need for a wrapper. However, Celo transactions have optional, additional fields that enable useful features like paying with stable tokens. This library enables the use of those extra fields.

## Install

`npm i @celo-tools/celo-ethers-wrapper`

or

`yarn add @celo-tools/celo-ethers-wrapper`

Note this wrapper has Ethers as a peer dependency. **Use celo-ethers-wrapper v1 versions for Ethers V5 and v2 versions for Ethers V6.**

## Basic Usage

Connect to the network by creating a `CeloProvider`, which is based on [JsonRpc-Provider](https://docs.ethers.org/v6/api/providers/jsonrpc):

```js
import { CeloProvider } from '@celo-tools/celo-ethers-wrapper'

// Connecting to Alfajores testnet
const provider = new CeloProvider('https://alfajores-forno.celo-testnet.org')
await provider.ready
```

Next, Create a CeloWallet, which is based on [Wallet](https://docs.ethers.org/v6/api/wallet) :

```js
import { CeloWallet } from '@celo-tools/celo-ethers-wrapper'

const wallet = new CeloWallet(YOUR_PK, provider)
```

Use the provider or wallet to make calls or send transactions:

```js
const txResponse = await wallet.sendTransaction({
    to: recipient,
    value: amountInWei,
  })
const txReceipt = await txResponse.wait()
console.info(`CELO transaction hash received: ${txReceipt.transactionHash}`)
```

## Contract Interaction

`CeloWallet` can be used to send transactions.

Here's an example of sending cUSD with the StableToken contract. For interacting with contracts you need the ABI and address. Addresses for Celo core contracts can be found with the CLI's `network:contracts` command. The ABIs can be built from the solidity code or extracted in ContractKit's `generated` folder.

```js
import { Contract, ethers, utils, providers } from 'ethers'

const stableToken = new ethers.Contract(address, abi, wallet)
console.info(`Sending ${amountInWei} cUSD`)
const txResponse: providers.TransactionResponse = await stableToken.transferWithComment(recipient, amountInWei, comment)
const txReceipt = await txResponse.wait()
console.info(`cUSD payment hash received: ${txReceipt.transactionHash}`)
```

## Alternative gas fee currencies

The Celo network supports paying for transactions with the native asset (CELO) but also with the stable token (cUSD).

This wrapper currently has partial support for specifying feeCurrency in transactions.

```js
const gasPrice = await wallet.getGasPrice(stableTokenAddress)
const gasLimit = await wallet.estimateGas(tx)

// Gas estimation doesn't currently work properly for non-CELO currencies
// The gas limit must be padded to increase tx success rate
// TODO: Investigate more efficient ways to handle this case
const adjustedGasLimit = gasLimit.mul(10)

const txResponse = await signer.sendTransaction({
  ...tx,
  gasPrice,
  gasLimit: adjustedGasLimit,
  feeCurrency: stableTokenAddress,
})
```

## Getting transaction history with CeloscanProvider

You can also rely on EthersProviders functionality, such as getting an account's transaction history, using our alternative CeloscanProvider

```js
import { CeloscanProvider } from '@celo-tools/celo-ethers-wrapper'

// You can use 'celo', 'alfajores' or 'baklava'.
// Default is 'celo' (mainnet)
const scanProvider = new CeloscanProvider('alfajores');

const history = await provider.getHistory(YOUR_ACCOUNT);
console.info("History:", history);
```

## Examples

See the tests under `/test` for more detailed examples.
