import { describe, expect, it, test } from "@jest/globals";
import { Contract, ContractFactory, parseEther, parseUnits } from "ethers";
import { TxTypeToPrefix, parseCeloTransaction, serializeCeloTransaction } from "../src/lib/transactions";
import HelloWorldContract from "./HelloWorld";
import { MINIMAL_USDC_ABI, getSigner } from "./common";
import { BLOCK_TIME, USDC_ADAPTER_ALFAJORES_ADDRESS, USDC_ALFAJORES_ADDRESS } from "./consts";

const signer = getSigner();
const usdc = new Contract(USDC_ALFAJORES_ADDRESS, MINIMAL_USDC_ABI, signer);

describe("[setup] supplied wallet has sufficient tokens to run tests", () => {
  test(
    "has at least 1 CELO",
    async () => {
      const balanceInWei = await signer.provider?.getBalance(signer.address);
      expect(balanceInWei).not.toBeUndefined();
      const balanceInDecimal = balanceInWei! / BigInt(1e18); // CELO has 18 decimals
      expect(balanceInDecimal).toBeGreaterThanOrEqual(1);
    },
    BLOCK_TIME * 3
  );

  test(
    "has at least 1 USDC",
    async () => {
      const balanceInWei = await usdc.balanceOf(signer.address);
      expect(balanceInWei).not.toBeUndefined();
      const balanceInDecimal = balanceInWei! / BigInt(1e6); // USDC has 6 decimals
      expect(balanceInDecimal).toBeGreaterThanOrEqual(1);
    },
    BLOCK_TIME * 3
  );
});

describe("[ethereum-compatibility] when sending a transaction with gas in CELO, then the transaction is always Ethereum-compatible", () => {
  test(
    "can transfer CELO with CELO as gas",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: BigInt(1),
        maxFeePerGas: BigInt(5e9) * BigInt(2) + BigInt(100e9), // ( base fee * 2 ) + tip
        maxPriorityFeePerGas: BigInt(100e9),
      });
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.type).toEqual(TxTypeToPrefix.eip1559); // transaction is EIP1559
      expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
    },
    BLOCK_TIME * 3
  );
  test(
    "can transfer CELO with CELO as gas, and estimate gas parameters",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: BigInt(1),
      });
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.type).toEqual(TxTypeToPrefix.eip1559); // transaction is EIP-1559
      expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
    },
    BLOCK_TIME * 3
  );

  test(
    "can transfer USDC with CELO as gas, and estimate gas",
    async () => {
      const txResponse = await usdc.transfer(signer.address, 1n);
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.type).toEqual(TxTypeToPrefix.eip1559); // transaction is EIP-1559
      expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
    },
    BLOCK_TIME * 3
  );
});

describe("[fee currency support] when sending transactions with gas in fee currency, then the transaction is always CIP-64", () => {
  test(
    "can transfer CELO with USDC as gas",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: BigInt(1),
        gasLimit: BigInt(1e5),
        maxFeePerGas: BigInt(5e9) * BigInt(2) + BigInt(1e9), // ( base fee * 2 ) + tip
        maxPriorityFeePerGas: BigInt(1e9),
        feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
      });
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.type).toEqual(TxTypeToPrefix.cip64); // transaction is CIP64
      expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
    },
    BLOCK_TIME * 3
  );
  test(
    "can transfer CELO with USDC as gas, and estimate gas parameters",
    async () => {
      const txResponse = await signer.sendTransaction({
        to: signer.address,
        value: 1n,
        feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
      });
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.type).toEqual(TxTypeToPrefix.cip64); // transaction is CIP64
      expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
    },
    BLOCK_TIME * 3
  );
  test(
    "can transfer USDC with USDC as gas, and estimate gas parameters",
    async () => {
      const transferBaseTx = await usdc.transfer.populateTransaction(signer.address, 1n);
      const txReceipt = await signer.sendTransaction({
        ...transferBaseTx,
        feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
      });
      /**
       * For future reference: Unfortunately, it's acknowledged that this
       * short-hand form is not currently supported in the celo-ethers-wrapper:
       *
       * ```ts
       * usdc.transfer(signer.address, 1n, {
       *  feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS
       * });
       * ```
       */
      expect(txReceipt?.type).toEqual(TxTypeToPrefix.cip64);
      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );
});

describe("[contract deployment]", () => {
  let contract: ReturnType<ContractFactory["deploy"]>;
  async function deployContract() {
    if (contract) return contract;

    contract = new Promise(async (resolve) => {
      const signer = getSigner();
      const factory = new ContractFactory(
        HelloWorldContract.abi,
        HelloWorldContract.bytecode,
        signer
      );
      resolve(await factory.deploy());
    });

    return contract;
  }

  test(
    "can deploy a contract",
    async () => {
      const contract = await deployContract();
      const receipt = await contract.deploymentTransaction()?.wait();
      expect(receipt?.contractAddress).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );

  test(
    "can call a function on a newly deployedContract",
    async () => {
      const contract = await deployContract();
      await contract.deploymentTransaction()?.wait();

      const txResponse = await (contract as Contract).setName("myName");
      const txReceipt = await txResponse.wait();

      expect(txReceipt?.hash).toMatch(/0x.{40}/);
    },
    BLOCK_TIME * 3
  );
});

describe('serializeCeloTransaction', () => {
  it('serializes CIP-66 transaction', () => {
    const tx = {
      to: signer.address,
      chainId: 42220,
      nonce: 1,
      feeCurrency: '0x765de816845861e75a25fca122bb6898b8b1282a',
      value: parseEther('1'),
      maxFeePerGas: parseUnits('2', 9),
      maxPriorityFeePerGas: parseUnits('2', 9),
      maxFeeInFeeCurrency: parseUnits('12345', 9),
    };
    
    expect(serializeCeloTransaction(tx)).toMatchInlineSnapshot(`"0x7af84b82a4ec0184773594008477359400809485a309ca5cdf852037ba7b4395530e30370ccd44880de0b6b3a764000080c094765de816845861e75a25fca122bb6898b8b1282a860b3a4b56fa00"`);
  });
});

describe('parseCeloTransaction', () => {
  it('serializes CIP-66 transaction', () => {
    expect(parseCeloTransaction('0x7af84b82a4ec0184773594008477359400809485a309ca5cdf852037ba7b4395530e30370ccd44880de0b6b3a764000080c094765de816845861e75a25fca122bb6898b8b1282a860b3a4b56fa00')).toMatchInlineSnapshot(`
{
  "accessList": [],
  "chainId": 42220,
  "data": "0x",
  "feeCurrency": "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  "gasLimit": 0n,
  "maxFeeInFeeCurrency": 12345000000000n,
  "maxFeePerGas": 2000000000n,
  "maxPriorityFeePerGas": 2000000000n,
  "nonce": 1,
  "to": "0x85a309CA5cDf852037bA7B4395530e30370CCd44",
  "type": 122,
  "value": 1000000000000000000n,
}
`);
  });
});