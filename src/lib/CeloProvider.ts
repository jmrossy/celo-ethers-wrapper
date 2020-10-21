import { providers, utils } from "ethers";
import { parseCeloTransaction } from "./transactions";

export class CeloProvider extends providers.JsonRpcProvider {
  /**
   * Override to parse transaction correctly
   * https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/base-provider.ts#L1016
   */
  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<providers.TransactionResponse> {
    // throw new Error('Currently unsupported, use sendTransactionRaw instead')
    await this.getNetwork();
    const signedTx = await Promise.resolve(signedTransaction);
    const hexTx = utils.hexlify(signedTx);
    const tx = parseCeloTransaction(signedTx);
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      return this._wrapTransaction(tx, hash);
    } catch (error) {
      error.transaction = tx;
      error.transactionHash = tx.hash;
      throw error;
    }
  }
}
