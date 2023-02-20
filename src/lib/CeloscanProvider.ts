import { logger, providers, utils } from "ethers";
import { getNetwork } from "./networks";

export class CeloscanProvider extends providers.EtherscanProvider {
    constructor(
        networkish: providers.Networkish = 'celo',
        apiKey?: string
    ) {
        const network = getNetwork(networkish);
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
        super(network, apiKey);
    }

    getBaseUrl(): string {
        switch (this.network ? this.network.name : "invalid") {
            case "celo":
                return "https:/\/explorer.celo.org/mainnet";
            case "alfajores":
                return "https:/\/explorer.celo.org/alfajores";
            case "baklava":
                return "https:/\/explorer.celo.org/baklava";
            default:
        };

        return logger.throwArgumentError("unsupported network", "network", this.network.name);
    }
}
