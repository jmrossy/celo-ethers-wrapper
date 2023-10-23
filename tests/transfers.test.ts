import { test, expect, describe } from "@jest/globals";
import { getSigner } from "./common";
import { BLOCK_TIME } from "./consts";
import RegistryABI from "@celo/abis/Registry.json";
import type { Registry, StableToken } from "@celo/abis/types/ethers";
import StableTokenABI from "@celo/abis/StableToken.json";
import { Contract } from "ethers";

const signer = getSigner();
const CUSD_ADDRESS: Promise<string> = new Promise(async (resolve) => {
  const REGISTRY_ADDRESS = "0x000000000000000000000000000000000000ce10";
  const registry = new Contract(
    REGISTRY_ADDRESS,
    RegistryABI.abi,
    signer
  ) as unknown as Registry;
  const cUSDAddress = await registry.getAddressForString("StableToken");
  resolve(cUSDAddress);
});

test("can get cUSD address", async () => {
  const address = await CUSD_ADDRESS;
  expect(address).toMatch(/0x.{40}/);
});

test("can fetch balance", async () => {
  const balance = await signer.provider?.getBalance(signer.address);
  expect(balance).toBeGreaterThan(0);
});

describe("[celo-legacy]", () => {
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
    BLOCK_TIME * 2
  );

  test(
    "can transfer CELO using cUSD as feeCurrency",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
        feeCurrency: await CUSD_ADDRESS,
      });
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 2
  );
});

describe("[cip-64]", () => {
  test(
    "can transfer CELO with cUSD as feeCurrency",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
        feeCurrency: await CUSD_ADDRESS,
        maxFeePerGas: 5000000000n,
        maxPriorityFeePerGas: 5000000000n,
      });
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 2
  );
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
    BLOCK_TIME * 2
  );
});

describe("cUSD contract", () => {
  test(
    "can cUSD directly with the cUSD contract",
    async () => {
      const stableToken = new Contract(
        await CUSD_ADDRESS,
        StableTokenABI.abi,
        signer
      ) as unknown as StableToken;
      const txResponse = await stableToken.transfer(signer.address, 1n);
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 2
  );
});
