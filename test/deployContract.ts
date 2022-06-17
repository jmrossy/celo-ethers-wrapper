import { ContractFactory } from "ethers";
import HelloWorldContract from "./HelloWorld.json";
import { getSigner } from "./utils";

async function main() {
  const signer = getSigner();
  console.info("Deploying to Alfajores with account", signer.address);
  const factory = new ContractFactory(
    HelloWorldContract.abi,
    HelloWorldContract.bytecode,
    signer
  );
  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.info("Contract deployed, address:", contract.address);

  console.info("Sending tx to contract");
  const txResponse = await contract.setName("myName");
  const txReceipt = await txResponse.wait();
  console.info("tx sent, hash:", txReceipt.transactionHash);
}

main()
  .then(() => console.info("Deployment complete"))
  .catch(console.error);
