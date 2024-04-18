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

export const MINIMAL_USDC_ABI = [
  // Read-only function
  "function balanceOf(address owner) view returns (uint256)",

  // Authenticated function
  "function transfer(address to, uint amount) returns (bool)",
];

/**
 * Ethers doesn't parse the `ethCompatible` field in RPC responses when 
 * calling the `eth_getTransactionByHash` method on Celo full nodes.
 * 
 * This hacky helper function directly calls `eth_getTransactionByHash` 
 * and provides the complete RPC response.
 * 
 * There is probably a better way to infer whether a transaction is ethCompatible
 * using the length of the RLP encoded raw object, but for now I'm using this.
 * 
 * @param hash 
 * @returns JSON-RPC response object
 */
export async function getTransactionByHash(hash: string): Promise<GetTransactionByHashResponse | undefined> {
  const url = FORNO_ALFAJORES_URL;
    const headers = {
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [hash],
        id: 1
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return undefined;
    }
}

export interface GetTransactionByHashResponse {
  id:      number;
  jsonrpc: string;
  result:  {
    blockHash:           string;
    blockNumber:         string;
    ethCompatible:       boolean;
    feeCurrency:         null;
    from:                string;
    gas:                 string;
    gasPrice:            string;
    gatewayFee:          string;
    gatewayFeeRecipient: null;
    hash:                string;
    input:               string;
    nonce:               string;
    r:                   string;
    s:                   string;
    to:                  string;
    transactionIndex:    string;
    type:                string;
    v:                   string;
    value:               string;
  };
}
