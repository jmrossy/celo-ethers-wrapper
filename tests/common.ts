import CeloProvider from "../src/lib/CeloProvider";
import CeloWallet from "../src/lib/CeloWallet";
import { FORNO_ALFAJORES_URL, CELO_DERIVATION_PATH } from "./consts";
import dotenv from 'dotenv';

// Configure dotenv to load test environment variables from `.env.test.local`
dotenv.config({ path: 'tests/.env.test.local' });

export function getSigner() {
  const provider = new CeloProvider(FORNO_ALFAJORES_URL);
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) throw new Error("No MNEMONIC provided in env");
  const wallet = CeloWallet.fromMnemonic(
    mnemonic,
    CELO_DERIVATION_PATH
  ).connect(provider);
  console.log("Using account", wallet.address);
  return wallet;
}

export function getAccount() {
  return getSigner().address;
}
