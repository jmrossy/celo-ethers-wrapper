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
import { L2_PROXY_ADMIN_ADDRESS } from "../consts";
import { getConversionRateFromCeloToToken } from "./CoreContract";

const forwardErrors = [
  "INSUFFICIENT_FUNDS",
  "NONCE_EXPIRED",
  "REPLACEMENT_UNDERPRICED",
] as ErrorCode[];

export default class CeloWallet extends Wallet {

  async isCel2(){
    const code = await this.provider?.getCode(L2_PROXY_ADMIN_ADDRESS)
    if (typeof code === 'string') {
      return code != '0x' && code.length > 2
    }
    return false
  }


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
        // If there is an error code it's an expected error
        if (forwardErrors.indexOf(error.code) >= 0) {
          throw error;
        }
        // If there is no error code it's an unexpected error
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

    await this.populateFees(tx);

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

  // sets feedata for the transaction. 
  // 
  async populateFees(tx: CeloTransactionRequest) { 
    const isCel2 = await this.isCel2()
    const noFeeCurrency = !tx.feeCurrency
    const useCIP66ForEasyFeeTransactions = isCel2 && !noFeeCurrency
    // CIP 66 transactions are denomiated in CELO not the fee token
    const feesAreInCELO = noFeeCurrency || useCIP66ForEasyFeeTransactions

    if (isEmpty(tx.maxPriorityFeePerGas) || isEmpty(tx.maxFeePerGas)) {
      const { maxFeePerGas, maxPriorityFeePerGas } = (await (
        this.provider as CeloProvider
      )?.getFeeData(tx.feeCurrency, feesAreInCELO))!;
      
      tx.maxFeePerGas = maxFeePerGas;
      tx.maxPriorityFeePerGas = maxPriorityFeePerGas;

      if (useCIP66ForEasyFeeTransactions && isEmpty(tx.maxFeeInFeeCurrency)) {
        const gasLimit = BigInt(tx.gasLimit!) 
        const maxFeeInFeeCurrency = await this.estimateMaxFeeInFeeToken({feeCurrency: tx.feeCurrency!, gasLimit, maxFeePerGas: maxFeePerGas!})
        tx.maxFeeInFeeCurrency = maxFeeInFeeCurrency
      }
    }

    return tx
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
   * For cip 66 transactions (the prefered way to pay for gas with fee tokens on Cel2) it is nessessary
   * to provide the absolute limit one is willing to pay denominated in the token. 
   * In contrast with earlier tx types for fee currencies (celo legacy, cip42, cip 64).
   * 
   * Calulating Estimation requires the gas, maxfeePerGas and the conversion rate from CELO to feeToken
   * https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0066.md
   */
  async estimateMaxFeeInFeeToken({gasLimit, maxFeePerGas, feeCurrency}: {gasLimit: bigint, maxFeePerGas: bigint, feeCurrency: string}) {

    const maxGasFeesInCELO = gasLimit * maxFeePerGas
    const [numerator, denominator] = await getConversionRateFromCeloToToken(feeCurrency, {wallet: this})
    const feeDenominatedInToken = (maxGasFeesInCELO * numerator) / denominator
    return feeDenominatedInToken
  }

  /**
   * Override to support alternative gas currencies 
   * @dev (for cip66 txn you want gasPrice in CELO so dont pass in the feeToken)
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
