import { hexlify, BigNumberish, isBytesLike, toBeHex } from "ethers";
import { GAS_INFLATION_FACTOR } from "../../consts";

function isEmpty(value: string | BigNumberish | undefined | null) {
  if (value === undefined || value === null || value === "0" || value === 0n) {
    return true;
  }
  if (isBytesLike(value)) {
    return hexlify(value) === "0x0";
  }
  return toBeHex(value) === "0x0";
}

export function isPresent(value: string | BigNumberish | undefined | null) {
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
    !isPresent(tx.gatewayFee)
  );
}

/**
 * Identifies transactions that specify the `feeCurrency` field, but are not yet EIP-1559,
 * because they don't specify `maxPriorityFeePerGas`, `maxFeePerGas`, and `gasLimit`.
 * 
 * @param tx object with transaction parameters 
 * @returns true if `feeCurrency` field is specified, false otherwise.
 */
export function isFeeCurrency(tx: any): boolean {
  return (
    isPresent(tx.feeCurrency) &&
    !isPresent(tx.gatewayFeeRecipient) &&
    !isPresent(tx.gatewayFee)
  )
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

export function adjustForGasInflation(gas: bigint): bigint {
  // NOTE: prevent floating point math
  return (gas * GAS_INFLATION_FACTOR) / 100n;
}
