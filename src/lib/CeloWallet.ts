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
import { adjustForGasInflation, isEmpty } from "./transaction/utils";
import { CeloTransaction, CeloTransactionRequest, serializeCeloTransaction } from "./transactions";

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
  async populateTransaction(transaction: CeloTransactionRequest): Promise<CeloTransaction> {
    let tx: any = await resolveProperties(transaction);

    if (isEmpty(tx.from)) {
      tx.from = this.address;
    }
    if (isEmpty(tx.nonce)) {
      tx.nonce = await this.provider?.getTransactionCount(tx.from, "pending");
    }
    if (isEmpty(tx.gasLimit)) {
      try {
        tx.gasLimit = await this.estimateGas(tx);
      } catch (error: any) {
        // If there is a code it's an expected error
        if (forwardErrors.indexOf(error.code) >= 0) {
          throw error;
        }
        // Else there is no code so it's an unexpected errors
        assertArgument(
          false,
          "cannot estimate gas; transaction may fail or may require manual gas limit",
          "transaction",
          {
            error: error,
            tx: tx,
          }
        );
      }
    }

    if (isEmpty(tx.maxPriorityFeePerGas) || isEmpty(tx.maxFeePerGas)) {
      const { maxFeePerGas, maxPriorityFeePerGas } = (await (
        this.provider as CeloProvider
      )?.getFeeData(tx.feeCurrency as string | undefined))!;
      tx.maxFeePerGas = maxFeePerGas;
      tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
    }

    if (isEmpty(tx.chainId)) {
      tx.chainId = (await this.provider!.getNetwork()).chainId;
    } else {
      tx.chainId = Promise.all([tx.chainId, (await this.provider!.getNetwork()).chainId]).then(
        ([txChainId, providerChainId]) => {
          if (providerChainId !== 0n && txChainId !== providerChainId) {
            assertArgument(false, "chainId address mismatch", "transaction", transaction);
          }
          return txChainId;
        }
      );
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

    const signature = this.signingKey.sign(keccak256(serializeCeloTransaction(tx)));
    const serialized = serializeCeloTransaction(tx, signature);
    return serialized;
  }

  /**
   * Override to serialize transaction using custom serialize method
   */
  async sendTransaction(transaction: CeloTransactionRequest): Promise<TransactionResponse> {
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

  static fromMnemonic(phrase: string, path?: string, wordlist?: Wordlist | null) {
    const hdWallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(phrase, null, wordlist), path);

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
