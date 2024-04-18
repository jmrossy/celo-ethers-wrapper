import { test, expect, describe } from "@jest/globals";
import { getSigner, getTransactionByHash, MINIMAL_USDC_ABI } from "./common";
import {
    BLOCK_TIME,
    CIP64_TRANSACTION_TYPE_NUMBER,
    USDC_ADAPTER_ALFAJORES_ADDRESS,
    USDC_ALFAJORES_ADDRESS,
} from "./consts";
import { Contract } from "ethers";

const signer = getSigner();
const usdc = new Contract(USDC_ALFAJORES_ADDRESS, MINIMAL_USDC_ABI, signer);

describe("supplied wallet has sufficient tokens to run tests", () => {
    test(
        "more than 1 CELO",
        async () => {
            console.log(`Getting CELO balance for ${signer.address} on Alfajores testnet`);
            const balanceInWei = await signer.provider?.getBalance(signer.address);
            expect(balanceInWei).not.toBeUndefined();

            const balanceInDecimal = balanceInWei! / BigInt(1e18); // CELO has 18 decimals
            console.log(`Balance is ${balanceInDecimal} CELO`);
            expect(balanceInDecimal).toBeGreaterThan(1);
        },
        BLOCK_TIME * 3
    );

    test(
        "more than 1 USDC",
        async () => {
            console.log(`Getting USDC balance for ${signer.address} on Alfajores testnet`);
            const balanceInWei = await usdc.balanceOf(signer.address);
            expect(balanceInWei).not.toBeUndefined();

            const balanceInDecimal = balanceInWei! / BigInt(1e6); // USDC has 6 decimals
            console.log(`Balance is ${balanceInDecimal} USDC`);
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
describe("when sending transactions with gas in CELO, then the transaction is an Ethereum-compatible type (ethCompatible = true)", () => {
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
    test("normal transfer", async () => {
        const txResponse = await signer.sendTransaction({
            to: signer.address,
            value: 1n,
        });
        const txReceipt = await txResponse.wait();
        expect(txReceipt?.type).toEqual(CIP64_TRANSACTION_TYPE_NUMBER);
    });

    test("normal transfer with gasLimit, maxFeePerGas, and maxPriorityFeePerGas", async () => {
        const txResponse = await signer.sendTransaction({
            to: signer.address,
            value: 1n,
            gasLimit: 100_000n,
            maxFeePerGas: BigInt(10e9), // gwei
            maxPriorityFeePerGas: BigInt(10e9), // gwei
            feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
        });
        const txReceipt = await txResponse.wait();
        expect(txReceipt?.type).toEqual(CIP64_TRANSACTION_TYPE_NUMBER);
    });
});

// describe("[celo-legacy]", () => {
//     /**
//      * TODO(Arthur): Delete or modify this test.
//      * Should not make celo legacy transaction anymore.
//      *
//      * Consider asserting that fallback option is used.
//      * Consider asserting that type is not 0x0 and ethCompatible is not false.
//      *
//      * Context: https://forum.celo.org/t/action-required-celo-legacy-tx-type-deprecation/7804
//      */
//   test(
//     "can transfer CELO",
//     async () => {
//       const txResponse = await signer.sendTransaction({
//         to: signer.address,
//         value: 1n,
//       });

//       // Or, alternatively, break apart signing and sending:
//       // const signedTx = await signer.signTransaction({
//       //   to: signer.address,
//       //   value: 1n,
//       // });
//       // const provider = signer.provider;
//       // const txResponse = await provider.sendTransaction(signedTx);
//       const txReceipt = await txResponse.wait();
//       expect(txReceipt?.hash).toMatch(/0x.{40}/);
//     },
//     BLOCK_TIME * 3
//   );

//   test(
//     "can transfer CELO using cUSD as feeCurrency",
//     async () => {
//       const txResponse = await signer.sendTransaction({
//         to: signer.address,
//         value: 1n,
//         feeCurrency: USDC_ALFAJORES_ADDRESS, // TODO(Arthur): Replace with USDC
//       });
//       const txReceipt = await txResponse.wait();
//       expect(txReceipt?.hash).toMatch(/0x.{40}/);
//     },
//     BLOCK_TIME * 3
//   );
// });

describe("[cip-64]", () => {
    test(
        "can transfer CELO with USDC as feeCurrency",
        async () => {
            const txResponse = await signer.sendTransaction({
                to: signer.address,
                value: 1n,
                feeCurrency: USDC_ALFAJORES_ADDRESS, // TODO(Arthur): Replace with USDC
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
