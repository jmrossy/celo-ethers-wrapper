import { test, expect, describe } from "@jest/globals";
import { getSigner, getTransactionByHash, MINIMAL_USDC_ABI } from "./common";
import { BLOCK_TIME, USDC_ADAPTER_ALFAJORES_ADDRESS, USDC_ALFAJORES_ADDRESS } from "./consts";
import { Contract, ContractFactory } from "ethers";
import { TxTypeToPrefix } from "../src/lib/transactions";
import HelloWorldContract from "./HelloWorld";

const signer = getSigner();
const usdc = new Contract(USDC_ALFAJORES_ADDRESS, MINIMAL_USDC_ABI, signer);

describe("[setup] supplied wallet has sufficient tokens to run tests", () => {
    test(
        "has more than 1 CELO",
        async () => {
            const balanceInWei = await signer.provider?.getBalance(signer.address);
            expect(balanceInWei).not.toBeUndefined();
            const balanceInDecimal = balanceInWei! / BigInt(1e18); // CELO has 18 decimals
            expect(balanceInDecimal).toBeGreaterThan(1);
        },
        BLOCK_TIME * 3
    );

    test(
        "has more than 1 USDC",
        async () => {
            const balanceInWei = await usdc.balanceOf(signer.address);
            expect(balanceInWei).not.toBeUndefined();
            const balanceInDecimal = balanceInWei! / BigInt(1e6); // USDC has 6 decimals
            expect(balanceInDecimal).toBeGreaterThan(1);
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
            expect(txReceipt).not.toBeNull();
            const jsonRpcResponse = await getTransactionByHash(txReceipt!.hash);

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
            expect(txReceipt).not.toBeNull();
            const jsonRpcResponse = await getTransactionByHash(txReceipt!.hash);

            expect(txReceipt?.type).toEqual(TxTypeToPrefix.eip1559); // transaction is EIP-1559
            expect(txReceipt?.hash).toMatch(/0x.{40}/); // transaction is successful
        },
        BLOCK_TIME * 3
    );

    test(
        "can transfer USDC with CELO as gas",
        async () => {
            const txResponse = await usdc.transfer(signer.address, 1n);
            const txReceipt = await txResponse.wait();
            expect(txReceipt).not.toBeNull();
            const jsonRpcResponse = await getTransactionByHash(txReceipt!.hash);

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

describe("Contract deployment", () => {
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
