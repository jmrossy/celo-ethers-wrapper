import { describe, expect, it } from "@jest/globals";
import { parseEther, parseUnits } from "ethers";
import { parseCeloTransaction, serializeCeloTransaction } from "../src/lib/transactions";

describe('serializeCeloTransaction', () => {
  it('serializes CIP-66 transaction', () => {
    const tx = {
      to: "0xF653A42ef024d174Bb4bE98B67690E5886d01F5F",
      chainId: 42220,
      nonce: 1,
      feeCurrency: '0x765de816845861e75a25fca122bb6898b8b1282a',
      value: parseEther('1'),
      maxFeePerGas: parseUnits('2', 9),
      maxPriorityFeePerGas: parseUnits('2', 9),
      maxFeeInFeeCurrency: parseUnits('12345', 9),
    };

    expect(serializeCeloTransaction(tx)).toMatchInlineSnapshot(`"0x7af84b82a4ec01847735940084773594008094f653a42ef024d174bb4be98b67690e5886d01f5f880de0b6b3a764000080c094765de816845861e75a25fca122bb6898b8b1282a860b3a4b56fa00"`);
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
