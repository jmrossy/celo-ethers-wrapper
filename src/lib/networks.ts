import { Networkish, assertArgument } from "ethers";

const networks = [
  {
    name: "celo",
    chainId: 42220,
  },
  {
    name: "alfajores",
    chainId: 44787,
  },
  {
    name: "baklava",
    chainId: 62320,
  },
];

export function getNetwork(network?: Networkish): null | Networkish {
  {
    if (network == null) {
      return null;
    }

    // Chain ID
    if (typeof network === "number" || typeof network === "bigint") {
      const matches = networks.filter((n) => n.chainId === Number(network));
      if (matches.length) {
        return {
          name: matches[0].name,
          chainId: matches[0].chainId,
        };
      }

      return {
        name: "unknown",
        chainId: Number(network),
      };
    }

    // Chain name
    if (typeof network === "string") {
      const matches = networks.filter((n) => n.name === network);
      if (matches.length) {
        return {
          name: matches[0].name,
          chainId: matches[0].chainId,
        };
      }
      return null;
    }

    if (
      typeof network.name === "string" &&
      typeof network.chainId === "number"
    ) {
      const byName = getNetwork(network.name);
      const byChainId = getNetwork(network.chainId);

      // Nothing standard; valid custom network
      if (byName == null && byChainId == null) {
        return {
          name: network.name,
          chainId: network.chainId,
        };
      }

      // Make sure if it is a standard chain the parameters match
      if (
        byName &&
        byChainId &&
        // @ts-expect-error
        byName.name === byChainId.name &&
        // @ts-expect-error
        byName.chainId === byChainId.chainId
      ) {
        return byName;
      }
    }

    assertArgument(false, "network chainId mismatch", "network", network);
  }
}
