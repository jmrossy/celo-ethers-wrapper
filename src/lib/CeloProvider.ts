import {
  JsonRpcProvider,
  PerformActionRequest,
  TransactionResponse,
  TransactionResponseParams,
  getBigInt,
  resolveProperties,
  toBeHex,
} from "ethers";
import { CeloTransactionRequest, parseCeloTransaction } from "./transactions";

export default class CeloProvider extends JsonRpcProvider {
  async _perform(req: PerformActionRequest): Promise<any> {
    // Legacy networks do not like the type field being passed along (which
    // is fair), so we delete type if it is 0 and a non-EIP-1559 network
    if (req.method === "call" || req.method === "estimateGas") {
      let tx = req.transaction;
      if (tx && tx.type != null && getBigInt(tx.type)) {
        // If there are no EIP-1559 properties, it might be non-EIP-1559
        if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
          const feeData = await this.getFeeData();
          if (
            feeData.maxFeePerGas == null &&
            feeData.maxPriorityFeePerGas == null
          ) {
            // Network doesn't know about EIP-1559 (and hence type)
            req = Object.assign({}, req, {
              transaction: Object.assign({}, tx, { type: undefined }),
            });
          }
        }
      }
    }

    const request = this.getRpcRequest(req);

    if (request != null) {
      return await this.send(request.method, request.args);
    }

    return super._perform(req);
  }

  /**
   * Override to handle alternative gas currencies
   * prepareRequest in https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts
   */
  getRpcRequest(
    req: PerformActionRequest
  ): null | { method: string; args: Array<any> } {
    if (req.method === "getGasPrice") {
      // @ts-expect-error
      const param = req.feeCurrencyAddress
        ? // @ts-expect-error
          [req.feeCurrencyAddress]
        : [];
      return { method: "eth_gasPrice", args: param };
    }

    /**
     * TODO(Arthur): gatewayFee and gatewayFeeRecipient are not supported anymore
     */
    if (req.method === "estimateGas") {
      const extraneous_keys = [
        ["from", (x: string) => x],
        ["feeCurrency", (x: string) => x],
        ["gatewayFeeRecipient", (x: string) => x],
        ["gatewayFee", toBeHex],
      ] as const;

      const tx = {
        ...this.getRpcTransaction(req.transaction),
      };
      extraneous_keys.forEach(([key, fn]) => {
        // @ts-expect-error
        if (req.transaction[key]) {
          // @ts-expect-error
          tx[key] = fn(req.transaction[key]);
        }
      });

      return { method: "eth_estimateGas", args: [tx] };
    }

    return super.getRpcRequest(req);
  }

  async estimateGas(_tx: CeloTransactionRequest): Promise<bigint> {
    return getBigInt(
      await this._perform({
        method: "estimateGas",
        // @ts-ignore
        transaction: _tx,
      }),
      "%response"
    );
  }

  async broadcastTransaction(signedTx: string): Promise<TransactionResponse> {
    const { hash } = await resolveProperties({
      blockNumber: this.getBlockNumber(),
      hash: this._perform({
        method: "broadcastTransaction",
        signedTransaction: signedTx,
      }),
      network: this.getNetwork(),
    });

    const tx = parseCeloTransaction(signedTx);
    if (tx.hash !== hash) {
      throw new Error("@TODO: the returned hash did not match");
    }

    return new TransactionResponse(tx as TransactionResponseParams, this);
  }
}
