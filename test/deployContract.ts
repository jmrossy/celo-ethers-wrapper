import { Contract, ContractFactory } from "ethers";
import HelloWorldContract from "./HelloWorld";
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
  const receipt = await contract.deploymentTransaction()?.wait();
  console.info("Contract deployed, address:", receipt?.contractAddress);

  console.info("Sending tx to contract");
  const txResponse = await (contract as Contract).setName("myName");
  const txReceipt = await txResponse.wait();
  console.info("tx sent, hash:", txReceipt.hash);
}

main()
  .then(() => console.info("Deployment complete"))
  .catch(console.error);
