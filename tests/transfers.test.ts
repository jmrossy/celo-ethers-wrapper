import { test, expect, describe } from "@jest/globals";
import { getSigner } from "./common";
import { BLOCK_TIME, CUSD_ADDRESS } from "./consts";
import { Contract, TransactionResponse } from "ethers";
import { STABLE_TOKEN_ABI } from "../test/stableToken";

const signer = getSigner();

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
        feeCurrency: CUSD_ADDRESS,
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
        feeCurrency: CUSD_ADDRESS,
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
      const stableToken = new Contract(CUSD_ADDRESS, STABLE_TOKEN_ABI, signer);
      const txResponse = (await stableToken.transfer(
        signer.address,
        1n
      )) as TransactionResponse;
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 2
  );
});
