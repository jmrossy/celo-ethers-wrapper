import { BigNumber, BigNumberish } from "ethers";
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

export function omit<T extends Object, K extends (keyof T)[]>(
  object: T,
  ...keys: K
): {
  [Key in keyof T as Key extends K ? never : Key]: T[Key];
} {
  return Object.keys(object)
    .filter((key) => !keys.includes(key as keyof T))
    .reduce((acc, key) => {
      acc[key as keyof T] = object[key as keyof T];
      return acc;
    }, {} as T);
}

export function adjustForGasInflation(gas: BigNumber): BigNumber {
  // NOTE: Don't ask me
  const GAS_INFLATION_FACTOR = 1.3;

  // NOTE: prevent floating point math
  return gas.mul(Math.floor(GAS_INFLATION_FACTOR * 100)).div(100);
}
