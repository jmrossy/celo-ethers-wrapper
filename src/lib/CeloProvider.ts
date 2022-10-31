import { BigNumber, providers, utils } from "ethers";
import { checkProperties, hexlify, hexValue, shallowCopy } from "ethers/lib/utils"
import { CeloJsonRpcSigner, _constructorGuard } from "./CeloRpcSigner"
import { AccessList, accessListify } from "@ethersproject/transactions";
import { getNetwork } from "./networks";
import { celoAllowedTransactionKeys, CeloTransactionRequest, parseCeloTransaction } from "./transactions";

const logger = new utils.Logger("CeloProvider");

export class CeloProvider extends providers.JsonRpcProvider {
  constructor(
    url?: utils.ConnectionInfo | string,
    network?: providers.Networkish
  ) {
    super(url, network);

    // Override certain block formatting properties that don't exist on Celo blocks
    // Reaches into https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/formatter.ts
    const blockFormat = this.formatter.formats.block;
    blockFormat.gasLimit = () => BigNumber.from(0);
    blockFormat.nonce = () => "";
    blockFormat.difficulty = () => 0;

    const blockWithTransactionsFormat =
      this.formatter.formats.blockWithTransactions;
    blockWithTransactionsFormat.gasLimit = () => BigNumber.from(0);
    blockWithTransactionsFormat.nonce = () => "";
    blockWithTransactionsFormat.difficulty = () => 0;
  }

  /**
   * Override to parse transaction correctly
   * https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/base-provider.ts
   */
  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<providers.TransactionResponse> {
    await this.getNetwork();
    const signedTx = await Promise.resolve(signedTransaction);
    const hexTx = utils.hexlify(signedTx);
    const tx = parseCeloTransaction(signedTx);
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      return this._wrapTransaction(tx, hash);
    } catch (error: any) {
      error.transaction = tx;
      error.transactionHash = tx.hash;
      throw error;
    }
  }

  /**
   * Override to handle alternative gas currencies
   * getGasPrice in https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/base-provider.ts
   */
  async getGasPrice(feeCurrencyAddress?: string) {
    await this.getNetwork();
    const params = feeCurrencyAddress ? { feeCurrencyAddress } : {};
    return BigNumber.from(await this.perform("getGasPrice", params));
  }

  /**
   * Override to handle alternative gas currencies
   * prepareRequest in https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts
   */
  prepareRequest(method: any, params: any): [string, Array<any>] {
    if (method === "getGasPrice") {
      const param = params.feeCurrencyAddress
        ? [params.feeCurrencyAddress]
        : [];
      return ["eth_gasPrice", param];
    }

    return super.prepareRequest(method, params);
  }

  static getNetwork(networkish: providers.Networkish): providers.Network {
    const network = getNetwork(networkish == null ? 'celo' : networkish);
    if (network == null) {
      return logger.throwError(
        `unknown network: ${JSON.stringify(network)}`,
        utils.Logger.errors.UNSUPPORTED_OPERATION,
        {
          operation: 'getNetwork',
          value: networkish,
        },
      );
    }
    return network;
  }

  getCeloSigner(addressOrIndex?: string | number) {
    return new CeloJsonRpcSigner(_constructorGuard, this, addressOrIndex)
  }


  // TODO signer.sendUncheckedTransaction calls hexlifyTransaction on the provider given to it.
  // and as it checks the propertiese against the allowedTransactionKeys need to either overwrite this function, or  sendUncheckedTransaction to call this with extraAllowed Keys.

  // Convert an ethers.js transaction into a JSON-RPC transaction
    //  - gasLimit => gas
    //  - All values hexlified
    //  - All numeric values zero-striped
    //  - All addresses are lowercased
    // NOTE: This allows a TransactionRequest, but all values should be resolved
    //       before this is called
    // @TODO: This will likely be removed in future versions and prepareRequest
    //        will be the preferred method for this.
    static hexlifyTransaction(transaction: CeloTransactionRequest, allowExtra?: { [key: string]: boolean }): { [key: string]: string | AccessList } {
        // Check only allowed properties are given
        const allowed = shallowCopy(celoAllowedTransactionKeys);
        if (allowExtra) {
            for (const key in allowExtra) {
                if (allowExtra[key]) { allowed[key] = true; }
            }
        }

        checkProperties(transaction, allowed);

        const result: { [key: string]: string | AccessList } = {};

        // JSON-RPC now requires numeric values to be "quantity" values
        ["chainId", "gasLimit", "gasPrice", "type", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "value"].forEach(function(key) {
            if ((<any>transaction)[key] == null) { return; }
            const value = hexValue(BigNumber.from((<any>transaction)[key]));
            if (key === "gasLimit") { key = "gas"; }
            result[key] = value;
        });

        // added feeCurrency Here
        ["from", "to", "data", "feeCurrency"].forEach(function(key) {
            if ((<any>transaction)[key] == null) { return; }
            result[key] = hexlify((<any>transaction)[key]);
        });

        if ((<any>transaction).accessList) {
            result["accessList"] = accessListify((<any>transaction).accessList);
        }

        return result;
    }
}