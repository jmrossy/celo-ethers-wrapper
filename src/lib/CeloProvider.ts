import { BigNumber, providers, utils } from "ethers";
import { getNetwork } from "./networks";
import { parseCeloTransaction } from "./transactions";

const logger = new utils.Logger("CeloProvider");

export class CeloProvider extends providers.JsonRpcProvider {
  /**
   * Override to parse transaction correctly
   * https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/base-provider.ts
   */
  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<providers.TransactionResponse> {
    await this.getNetwork();
    const hexTx = await Promise.resolve(signedTransaction).then((t) =>
      utils.hexlify(t)
    );
    const tx = parseCeloTransaction(hexTx);
    const blockNumber = await this._getInternalBlockNumber(
      100 + 2 * this.pollingInterval
    );
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      return this._wrapTransaction(tx, hash, blockNumber);
    } catch (error) {
      (<any>error).transaction = tx;
      (<any>error).transactionHash = tx.hash;
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
    const network = getNetwork(networkish == null ? "celo" : networkish);
    if (network == null) {
      return logger.throwError(
        `unknown network: ${JSON.stringify(network)}`,
        utils.Logger.errors.UNSUPPORTED_OPERATION,
        {
          operation: "getNetwork",
          value: networkish,
        }
      );
    }
    return network;
  }
}
