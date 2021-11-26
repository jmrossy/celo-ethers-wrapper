import { providers } from "ethers";
import { CeloProvider } from "./CeloProvider";

// An extension of CeloProvider that mimics StaticJsonRpcProvider to avoid
// unnecessary network traffic on static nodes
// See https://docs.ethers.io/v5/api/providers/jsonrpc-provider/#StaticJsonRpcProvider
export class StaticCeloProvider extends CeloProvider {
  detectNetwork = providers.StaticJsonRpcProvider.prototype.detectNetwork;
}
