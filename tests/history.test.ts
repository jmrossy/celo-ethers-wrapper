import { describe, expect, test } from "@jest/globals";
import { CeloscanProvider } from "../src/lib/CeloscanProvider";
import {
    ADDRESS_WITH_MAINNET_TRANSACTION_HISTORY,
    ADDRESS_WITH_ALFAJORES_TRANSACTION_HISTORY,
    ADDRESS_WITH_BAKLAVA_TRANSACTION_HISTORY,
    CELOSCAN_PROVIDER_MAINNET_NETWORK_NAME, 
    CELOSCAN_PROVIDER_ALFAJORES_NETWORK_NAME,
    CELOSCAN_PROVIDER_BAKLAVA_NETWORK_NAME
} from "./consts";
import { getAccount, getSigner } from "./common";

/**
 * TODO(Arthur): Ensure this test runs sequentially after a transfer or transaction has been 
 * triggered in a test suite run or the test runs on an address that is known to have transactions.
 * 
 * Otherwise a brand new wallet with no transaction history will fail this test.
 * 
 * This test currently fails with my newly initialised and fauceted account.
 * 
 * Might not be necessary to change order of execution, but re-evaluate what this
 * test asserts. Seems Celoscan specific.
 */
describe(`can fetch an account's "normal" transaction history`, () => {
    test("on Celo Mainnet", async () => {
        const address = ADDRESS_WITH_MAINNET_TRANSACTION_HISTORY;
        const network = CELOSCAN_PROVIDER_MAINNET_NETWORK_NAME;

        expect(address).not.toBeUndefined();
        expect(network).not.toBeUndefined();
      
        console.log(`Getting list of 'normal' transactions by address for ${address} on ${network}`);
        const provider = new CeloscanProvider(network);
        const history = await provider.getHistory(address!);
      
        expect(history.length).toBeGreaterThan(0);
      });

    test("on Alfajores testnet", async () => {
      const address = ADDRESS_WITH_ALFAJORES_TRANSACTION_HISTORY;
      const network = CELOSCAN_PROVIDER_ALFAJORES_NETWORK_NAME;

      expect(address).not.toBeUndefined();
      expect(network).not.toBeUndefined();
    
      console.log(`Getting list of 'normal' transactions by address for ${address} on ${network}`);
      const provider = new CeloscanProvider(network);
      const history = await provider.getHistory(address!);
    
      expect(history.length).toBeGreaterThan(0);
    });

    test("on Baklava testnet", async () => {
      const address = ADDRESS_WITH_BAKLAVA_TRANSACTION_HISTORY;
      const network = CELOSCAN_PROVIDER_BAKLAVA_NETWORK_NAME;

      expect(address).not.toBeUndefined();
      expect(network).not.toBeUndefined();
    
      console.log(`Getting list of 'normal' transactions by address for ${address} on ${network}`);
      const provider = new CeloscanProvider(network);
      const history = await provider.getHistory(address!);
    
      expect(history.length).toBeGreaterThan(0);
    });

})

describe("can fetch an account's balance", () => {
  test("on Alfajores testnet", async () => {
    const address = getAccount();

    console.log(`Getting balance for ${address} on Alfajores testnet`);
    const balance = await getSigner().provider?.getBalance(getAccount());

    expect(balance).toBeGreaterThan(0);
  });
});