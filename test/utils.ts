import { CeloProvider } from "../src/lib/CeloProvider";
import { CeloWallet } from "../src/lib/CeloWallet";
import { ALFAJORES_FORNO, CELO_DERIVATION_PATH } from "./consts";

export function getSigner() {
  console.info("Getting signer");
  const provider = new CeloProvider(ALFAJORES_FORNO);
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) throw new Error("No MNEMONIC provided in env");
  const wallet = CeloWallet.fromMnemonic(
    mnemonic,
    CELO_DERIVATION_PATH
  ).connect(provider);
  console.info("Signer and provider ready");
  return wallet;
}
