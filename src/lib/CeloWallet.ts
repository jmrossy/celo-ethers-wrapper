import {
  assertArgument,
  ErrorCode,
  getAddress,
  HDNodeWallet,
  keccak256,
  Mnemonic,
  PerformActionRequest,
  Provider,
  resolveProperties,
  TransactionResponse,
  Wallet,
  Wordlist,
} from "ethers";
import CeloProvider from "./CeloProvider";
import { adjustForGasInflation } from "./transaction/utils";
import {
  CeloTransaction,
  CeloTransactionRequest,
  getTxType,
  serializeCeloTransaction,
} from "./transactions";

// const logger = new utils.Logger("CeloWallet");

const forwardErrors = [
  "INSUFFICIENT_FUNDS",
  "NONCE_EXPIRED",
  "REPLACEMENT_UNDERPRICED",
] as ErrorCode[];

export default class CeloWallet extends Wallet {
  /**
   * Override to skip checkTransaction step which rejects Celo tx properties
   * https://github.com/ethers-io/ethers.js/blob/master/packages/abstract-signer/src.ts/index.ts
   */
  async populateTransaction(
    transaction: CeloTransactionRequest
  ): Promise<CeloTransaction> {
    let tx: any = await resolveProperties(transaction);
    if (tx.to != null) {
      tx.to = Promise.resolve(tx.to);
    }

    if (tx.from == null) {
      tx.from = this.address;
    }

    const type = getTxType(tx);
    if (!type && tx.gasPrice == null) {
      tx.gasPrice = this.getGasPrice();
    }

    if (tx.nonce == null) {
      tx.nonce = await this.provider?.getTransactionCount(tx.from, "pending");
    }

    tx = await resolveProperties(tx);
    if (tx.gasLimit == null) {
      tx.gasLimit = this.estimateGas(tx).catch((error) => {
        if (forwardErrors.indexOf(error.code) >= 0) {
          throw error;
        }
        assertArgument(
          false,
          "cannot estimate gas; transaction may fail or may require manual gas limit",
          "transaction",
          {
            error: error,
            tx: tx,
          }
        );
      });
    }

    if (tx.chainId == null) {
      tx.chainId = (await this.provider!.getNetwork()).chainId;
    } else {
      tx.chainId = Promise.all([
        Promise.resolve(tx.chainId),
        (await this.provider!.getNetwork()).chainId,
      ]).then((results) => {
        if (results[1] !== 0n && results[0] !== results[1]) {
          assertArgument(
            false,
            "chainId address mismatch",
            "transaction",
            transaction
          );
        }
        return results[0];
      });
    }
    return resolveProperties<CeloTransaction>(tx);
  }

  /**
   * Override to serialize transaction using custom serialize method
   * https://github.com/ethers-io/ethers.js/blob/master/packages/wallet/src.ts/index.ts
   */
  async signTransaction(transaction: CeloTransactionRequest): Promise<string> {
    const tx = await this.populateTransaction(transaction);

    if (tx.from != null) {
      if (getAddress(tx.from) !== this.address) {
        assertArgument(
          false,
          "transaction from address mismatch",
          "transaction.from",
          transaction.from
        );
      }
      delete tx.from;
    }

    const signature = this.signingKey.sign(
      keccak256(serializeCeloTransaction(tx))
    );
    const serialized = serializeCeloTransaction(tx, signature);
    return serialized;
  }

  /**
   * Override to serialize transaction using custom serialize method
   */
  async sendTransaction(
    transaction: CeloTransactionRequest
  ): Promise<TransactionResponse> {
    const provider = this.provider!;

    const pop = await this.populateTransaction(transaction);
    delete pop.from;
    return await provider.broadcastTransaction(await this.signTransaction(pop));
  }

  /**
   * Override to skip checkTransaction step which rejects Celo tx properties
   * https://github.com/ethers-io/ethers.js/blob/master/packages/abstract-signer/src.ts/index.ts
   */
  async estimateGas(transaction: CeloTransactionRequest): Promise<bigint> {
    return this.provider!.estimateGas(transaction).then(adjustForGasInflation);
  }

  /**
   * Override to support alternative gas currencies
   * https://github.com/celo-tools/ethers.js/blob/master/packages/abstract-signer/src.ts/index.ts
   */
  async getGasPrice(feeCurrencyAddress?: string): Promise<bigint> {
    return await (this.provider as CeloProvider)._perform({
      method: "getGasPrice",
      feeCurrencyAddress,
    } as PerformActionRequest);
  }

  static fromMnemonic(
    phrase: string,
    path?: string,
    wordlist?: Wordlist | null
  ) {
    const hdWallet = HDNodeWallet.fromMnemonic(
      Mnemonic.fromPhrase(phrase, null, wordlist),
      path
    );

    return new CeloWallet(hdWallet.privateKey, new CeloProvider());
  }

  /**
   * Override just for type fix
   * https://github.com/ethers-io/ethers.js/blob/master/packages/wallet/src.ts/index.ts
   */
  connect(provider: Provider | null) {
    return new CeloWallet(this.signingKey, provider);
  }
}
