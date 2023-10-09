import {
  BlockTag,
  EtherscanProvider,
  Networkish,
  assertArgument,
} from "ethers";
import { getNetwork } from "./networks";

export class CeloscanProvider extends EtherscanProvider {
  constructor(networkish: Networkish = "celo", apiKey?: string) {
    const network = getNetwork(networkish);
    super(network!, apiKey);
  }

  getBaseUrl(): string {
    switch (this.network ? this.network.name : "invalid") {
      case "celo":
        return "https://api.celoscan.io";
      case "alfajores":
        return "https://alfajores.celoscan.io";
      case "baklava":
        // baklava is currently not supported by celoscan.io, so we use Blockscout
        return "https://explorer.celo.org/baklava";
      default:
    }

    assertArgument(false, "unsupported network", "network", this.network);
  }

  async getHistory(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<any>> {
    const params = {
      action: "txlist",
      address,
      startblock: startBlock == null ? 0 : startBlock,
      endblock: endBlock == null ? 99999999 : endBlock,
      sort: "asc",
    };

    return this.fetch("account", params);
  }
}
