import { BigNumber, Contract } from "ethers";
import { CUSD_ADDRESS } from "./consts";
import { STABLE_TOKEN_ABI } from "./stableToken";
import { getSigner } from "./utils";

async function main() {
  const signer = getSigner();
  // console.info("Getting account balance for:", signer.address);
  const balance = await signer.getBalance();
  console.info("Balance:", balance.toString());

  // console.info("Sending 1 CELO wei", signer.address);
  const txResponse1 = await signer.sendTransaction({
    to: signer.address,
    value: BigNumber.from("1"),
  });

  // Or, alternatively, break apart signing and sending:
  // const signedTx = await signer.signTransaction({
  //   to: signer.address,
  //   value: BigNumber.from("1"),
  // });
  // const provider = signer.provider;
  // const txResponse1 = await provider.sendTransaction(signedTx);
  const txReceipt1 = await txResponse1.wait();
  console.info("Funds sent. Hash:", txReceipt1.transactionHash);

  console.info("Sending 1 CELO wei with cUSD feeCurrency");
  const txResponse1feeCurrency = await signer.sendTransaction({
    to: signer.address,
    value: BigNumber.from("1"),
    feeCurrency: CUSD_ADDRESS,
    maxFeePerGas: BigNumber.from(5000000000),
    maxPriorityFeePerGas: BigNumber.from(5000000000),
  });
  const txReceipt1FeeCurency = await txResponse1feeCurrency.wait();
  console.info(
    `CELO w/ feeCurrency payment hash: ${txReceipt1FeeCurency.transactionHash}`
  );

  const stableToken = new Contract(CUSD_ADDRESS, STABLE_TOKEN_ABI, signer);

  console.info("Getting cUSD balance");
  const stableBalance = await stableToken.balanceOf(signer.address);
  console.info(`cUSD balance: ${stableBalance.toString()}`);

  console.info("Sending 1 cUSD wei");
  const txResponse2 = await stableToken.transfer(
    signer.address,
    BigNumber.from("1")
  );
  const txReceipt2 = await txResponse2.wait();
  console.info(`cUSD payment hash: ${txReceipt2.transactionHash}`);
}

main()
  .then(() => console.info("Contract tests complete"))
  .catch(console.error);
