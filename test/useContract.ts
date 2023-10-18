import { CUSD_ADDRESS } from "./consts";
import { getSigner } from "./utils";
import { Contract, TransactionResponse } from "ethers";
import { STABLE_TOKEN_ABI } from "./stableToken";

async function main() {
  const signer = getSigner();
  console.info("Getting account balance for:", signer.address);
  const balance = await signer.provider?.getBalance(signer.address);
  console.info("Balance:", balance);

  console.info("Sending 1 CELO wei", signer.address);
  const txResponse1 = await signer.sendTransaction({
    to: signer.address,
    value: 1n,
  });

  // Or, alternatively, break apart signing and sending:
  // const signedTx = await signer.signTransaction({
  //   to: signer.address,
  //   value: 1n,
  // });
  // const provider = signer.provider;
  // const txResponse1 = await provider.sendTransaction(signedTx);
  const txReceipt1 = await txResponse1.wait();
  console.info("Funds sent. Hash:", txReceipt1?.hash);

  console.info(
    "[celo-legacy] Sending 1 CELO wei with cUSD feeCurrency",
    signer.address
  );
  const txResponseLegacy = await signer.sendTransaction({
    to: signer.address,
    value: 1n,
    feeCurrency: CUSD_ADDRESS,
  });
  const txReceiptLegacy = await txResponseLegacy.wait();
  console.info(
    `[celo-legacy] CELO w/ feeCurrency payment hash: ${txReceiptLegacy?.hash}`
  );

  console.info("[cip64] Sending 1 CELO wei with cUSD feeCurrency");
  const txResponseCip64 = await signer.sendTransaction({
    to: signer.address,
    value: 1n,
    feeCurrency: CUSD_ADDRESS,
    maxFeePerGas: 5000000000n,
    maxPriorityFeePerGas: 5000000000n,
  });
  const txReceiptCip64 = await txResponseCip64.wait();
  console.info(
    `[cip64] CELO w/ feeCurrency payment hash: ${txReceiptCip64?.hash}`
  );

  console.info("[eip1559] Sending 1 CELO wei");
  const txResponseEip1559 = await signer.sendTransaction({
    to: signer.address,
    value: 1n,
    maxFeePerGas: 5000000000n,
    maxPriorityFeePerGas: 5000000000n,
  });
  const txReceiptEip1559 = await txResponseEip1559.wait();
  console.info(`[eip1559] CELO payment hash: ${txReceiptEip1559?.hash}`);

  const stableToken = new Contract(CUSD_ADDRESS, STABLE_TOKEN_ABI, signer);

  console.info("Getting cUSD balance");
  const stableBalance = await stableToken.balanceOf(signer.address);
  console.info(`cUSD balance: ${stableBalance.toString()}`);

  console.info("Sending 1 cUSD wei");
  const txResponse2 = (await stableToken.transfer(
    signer.address,
    1n
  )) as TransactionResponse;
  const txReceipt2 = await txResponse2.wait();
  console.info(`cUSD payment hash: ${txReceipt2?.hash}`);
}

main()
  .then(() => console.info("Contract tests complete"))
  .catch(console.error);
