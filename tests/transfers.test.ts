import { test, expect, describe } from "@jest/globals";
import { getSigner, getTransactionByHash, MINIMAL_USDC_ABI } from "./common";
import {
    BLOCK_TIME,
    TxTypeNumber,
    USDC_ADAPTER_ALFAJORES_ADDRESS,
    USDC_ALFAJORES_ADDRESS,
} from "./consts";
import { Contract } from "ethers";

const signer = getSigner();
const usdc = new Contract(USDC_ALFAJORES_ADDRESS, MINIMAL_USDC_ABI, signer);

describe("[setup] supplied wallet has sufficient tokens to run tests", () => {
    test(
        "more than 1 CELO",
        async () => {
            const balanceInWei = await signer.provider?.getBalance(signer.address);
            expect(balanceInWei).not.toBeUndefined();
            const balanceInDecimal = balanceInWei! / BigInt(1e18); // CELO has 18 decimals
            expect(balanceInDecimal).toBeGreaterThan(1);
        },
        BLOCK_TIME * 3
    );

    test(
        "more than 1 USDC",
        async () => {
            const balanceInWei = await usdc.balanceOf(signer.address);
            expect(balanceInWei).not.toBeUndefined();
            const balanceInDecimal = balanceInWei! / BigInt(1e6); // USDC has 6 decimals
            expect(balanceInDecimal).toBeGreaterThan(1);
        },
        BLOCK_TIME * 3
    );
});

/**
 * Tests that ensure Celo Legacy transactions and CIP42 transactions are
 * fully deprecated.
 *
 * TODO(Arthur): clean up this message before merging.
 *
 * Default logic:
 *
 * 1. When sending transaction with gas in CELO then ethCompatible is true
 * 2. When sending transaction with fee currency not CELO then type is 123 (CIP64)
 *
 * Should TS complain that maxFeePerGas etc is not defined, or that feeCurrency is not
 * permitted without it?
 */
describe("[ETH compatible] when sending transactions with gas in CELO, then the transaction is an Ethereum-compatible type (ethCompatible = true)", () => {
    test(
        "normal transfer",
        async () => {
            const txResponse = await signer.sendTransaction({
                to: signer.address,
                value: 1n,
            });
            const txReceipt = await txResponse.wait();
            expect(txReceipt).not.toBeNull();
            const jsonRpcResponse = await getTransactionByHash(txReceipt!.hash);
            expect(jsonRpcResponse?.result.ethCompatible).toBe(true);
        },
        BLOCK_TIME * 3
    );

    test("ERC20 transfer", async () => {
        const txResponse = await usdc.transfer(signer.address, 1n);
        const txReceipt = await txResponse.wait();
        expect(txReceipt).not.toBeNull();
        const jsonRpcResponse = await getTransactionByHash(txReceipt!.hash);
        expect(jsonRpcResponse?.result.ethCompatible).toBe(true);
    });
});

describe("when sending transactions with gas in fee currency, then the transaction is always CIP-64", () => {
    test("normal transfer with USDC as gas", async () => {
        const txResponse = await signer.sendTransaction({
            to: signer.address,
            value: 1n,
            feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
        });
        const txReceipt = await txResponse.wait();
        /**
         * At the moment, 
         */
        // When feeCurrency is specified, but `gasLimit`, `maxFeePerGas`, and `maxPriorityFeePerGas`
        // are not specified, then the fee currency field is dropped and a normal Ethereum type 0 
        // transaction is built.
        // Should TypeScript complain here? That might make it easier for devs to avoid
        // making type 0 transactions by mistake.
        expect(txReceipt?.type).toEqual(TxTypeNumber.ETHEREUM_LEGACY);
    });

    test("normal transfer with USDC as gas, and gasLimit, maxFeePerGas, and maxPriorityFeePerGas", async () => {
        const txResponse = await signer.sendTransaction({
            to: signer.address,
            value: 1n,
            gasLimit: 100_000n,
            maxFeePerGas: BigInt(10e9), // gwei
            maxPriorityFeePerGas: BigInt(10e9), // gwei
            feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
        });
        const txReceipt = await txResponse.wait();
        expect(txReceipt?.type).toEqual(TxTypeNumber.CIP64);
    });
});

describe("[cip-64]", () => {
    test(
        "can transfer CELO with USDC as feeCurrency",
        async () => {
            const txResponse = await signer.sendTransaction({
                to: signer.address,
                value: 1n,
                feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS, // TODO(Arthur): Replace with USDC
                maxFeePerGas: 5000000000n,
                maxPriorityFeePerGas: 5000000000n,
            });
            const txReceipt = await txResponse.wait();
            expect(txReceipt?.hash).toMatch(/0x.{40}/);
        },
        BLOCK_TIME * 3
    );
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
        "can transfer CELO with CELO as gas",
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
