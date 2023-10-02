import { BigNumber, providers, utils } from "ethers";
import { getNetwork } from "./networks";
import { CeloTransactionRequest, parseCeloTransaction } from "./transactions";

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

    if (method === "estimateGas") {
      // NOTE: somehow estimategas trims lots of fields
      // this overrides it
      const extraneous_keys = [
        ["from", (x: string) => x],
        ["feeCurrency", utils.hexlify],
        ["gatewayFeeRecipient", (x: string) => x],
        ["gatewayFee", utils.hexlify],
      ] as const;

      const tx = {
        // @ts-expect-error
        ...this.constructor.hexlifyTransaction(
          params.transaction,
          extraneous_keys.reduce((acc, [key]) => {
            acc[key] = true;
            return acc;
          }, {} as Record<string, true>)
        ),
      };
      extraneous_keys.forEach(([key, fn]) => {
        if (params.transaction[key]) {
          tx[key] = fn(params.transaction[key]);
        }
      });

      return ["eth_estimateGas", [tx]];
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

  async estimateGas(
    transaction: utils.Deferrable<CeloTransactionRequest>
  ): Promise<BigNumber> {
    // NOTE: Overrides the ethers method to make sure feeCurrency and from are sent
    // to the rpc node
    await this.getNetwork();
    const params = await utils.resolveProperties({
      transaction,
    });
    const result = await this.perform("estimateGas", params);
    try {
      return BigNumber.from(result);
    } catch (error) {
      return logger.throwError(
        "bad result from backend",
        utils.Logger.errors.SERVER_ERROR,
        {
          method: "estimateGas",
          params,
          result,
          error,
        }
      );
    }
  }
}
