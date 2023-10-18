import { CeloscanProvider } from "../src/lib/CeloscanProvider";

async function main() {
  const account = process.env.ACCOUNT;
  if (!account) throw new Error("No ACCOUNT provided in env");
  const network = process.env.NETWORK?.toLocaleLowerCase() || "celo";
  console.info("Using CeloscanProvider with", network.toUpperCase(), "network");
  const provider = new CeloscanProvider(network);
  const history = await provider.getHistory(account);
  console.info("Account", account, "history:");
  console.info(history);
}

main()
  .then(() => console.info("Get history complete"))
  .catch(console.error);
