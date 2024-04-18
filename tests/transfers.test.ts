import { test, expect, describe } from "@jest/globals";
import { getSigner } from "./common";
import { BLOCK_TIME, CUSD_ADDRESS } from "./consts";
import RegistryABI from "@celo/abis/Registry.json";
import type { Registry, StableToken } from "@celo/abis/types/ethers";
import StableTokenABI from "@celo/abis/StableToken.json";
import { Contract } from "ethers";

const signer = getSigner();
const CUSD_ADDRESS_FROM_REGISTRY: Promise<string> = new Promise(
  async (resolve) => {
    const REGISTRY_ADDRESS = "0x000000000000000000000000000000000000ce10";
    const registry = new Contract(
      REGISTRY_ADDRESS,
      RegistryABI.abi,
      signer
    ) as unknown as Registry;
    const cUSDAddress = await registry.getAddressForString("StableToken");
    resolve(cUSDAddress);
  }
);

test("can get cUSD address from registry", async () => {
  const address = await CUSD_ADDRESS_FROM_REGISTRY;
  expect(address).toEqual(CUSD_ADDRESS);
});

test("can fetch balance", async () => {
  const balance = await signer.provider?.getBalance(signer.address);
  expect(balance).toBeGreaterThan(0);
});

describe("[celo-legacy]", () => {
    /**
     * TODO(Arthur): Delete or modify this test. 
     * Should not make celo legacy transaction anymore.
     * 
     * Consider asserting that fallback option is used.
     * Consider asserting that type is not 0x0 and ethCompatible is not false. 
     * 
     * Context: https://forum.celo.org/t/action-required-celo-legacy-tx-type-deprecation/7804
     */
  test(
    "can transfer CELO",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
      });

      // Or, alternatively, break apart signing and sending:
      // const signedTx = await signer.signTransaction({
      //   to: signer.address,
      //   value: 1n,
      // });
      // const provider = signer.provider;
      // const txResponse = await provider.sendTransaction(signedTx);
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );

  test(
    "can transfer CELO using cUSD as feeCurrency",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
        feeCurrency: CUSD_ADDRESS,
      });
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );
});

describe("[cip-64]", () => {
    test("can transfer USDC with USDC as feeCurrency", async () => {
        /**
         * TODO(Arthur): This test is incomplete. At the moment, it doesn't
         * make the ERC-20 transfer with USDC as a fee currency.
         */
        const txResponse = await usdc.transfer(signer.address, 1n);
        const txReceipt = await txResponse.wait();
        expect(txReceipt?.hash).toMatch(/0x.{40}/);
    });
});
describe("[eip-1559]", () => {
  test(
    "can transfer CELO with cUSD as feeCurrency",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
        maxFeePerGas: 5000000000n,
        maxPriorityFeePerGas: 5000000000n,
      });
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );
});
