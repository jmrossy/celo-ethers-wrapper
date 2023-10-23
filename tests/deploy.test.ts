import { test, expect } from "@jest/globals";
import { getSigner } from "./common";
import { Contract, ContractFactory } from "ethers";
import HelloWorldContract from "./HelloWorld";
import { BLOCK_TIME } from "./consts";

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
