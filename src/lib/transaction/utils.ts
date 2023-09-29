import { BigNumberish } from "ethers";
import { hexlify } from "ethers/lib/utils";

function isEmpty(value: string | BigNumberish | undefined | null) {
  return (
    value === undefined ||
    value === null ||
    value === "0" ||
    (typeof value == "string"
      ? value.toLowerCase() === "0x" || value.toLowerCase() === "0x0"
      : hexlify(value) === "0x0")
  );
}
function isPresent(value: string | BigNumberish | undefined | null) {
  return !isEmpty(value);
}

export function isEIP1559(tx: any): boolean {
  return isPresent(tx.maxFeePerGas) && isPresent(tx.maxPriorityFeePerGas);
}

export function isCIP64(tx: any) {
  return (
    isEIP1559(tx) &&
    isPresent(tx.feeCurrency) &&
    !isPresent(tx.gatewayFeeRecipient) &&
    !isPresent(tx.gatewayFeeRecipient)
  );
}
export function isCIP42(tx: any): boolean {
  return (
    isEIP1559(tx) &&
    (isPresent(tx.feeCurrency) ||
      isPresent(tx.gatewayFeeRecipient) ||
      isPresent(tx.gatewayFee))
  );
}

export function concatHex(values: string[]): `0x${string}` {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
