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