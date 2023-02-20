import { CeloscanProvider } from "../src/lib/CeloscanProvider";

async function main() {
    const account = process.env.ACCOUNT;
    if (!account) throw new Error("No ACCOUNT provided in env");
    const network = process.env.NETWORK?.toLocaleLowerCase() || "celo";
    if (network !== "celo" && network !== "alfajores" && network !== "baklava") throw new Error("Invalid NETWORK provided in env. Use celo, alfajores, or baklava");
    console.info("Using CeloscanProvider with", network.toUpperCase(), "network");
    const provider = new CeloscanProvider(network);
    const history = await provider.getHistory(account);
    console.info("Account", account, "history:");
    console.info(history);
}

main()
    .then(() => console.info("Get history complete"))
    .catch(console.error);
