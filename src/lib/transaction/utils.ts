import { hexlify, BigNumberish, isBytesLike, toBeHex } from "ethers";
import { GAS_INFLATION_FACTOR } from "../../consts";
import { CeloTransaction, CeloTransactionCip64, CeloTransactionCip66 } from "../transactions";

export function isEmpty(value: string | BigNumberish | undefined | null) {
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

export function isCIP64(tx: CeloTransaction) {
  return isPresent((tx as CeloTransactionCip64).feeCurrency);
}

export function isCIP66(tx: CeloTransaction) {
  return isPresent((tx as CeloTransactionCip66).feeCurrency)
    && isPresent((tx as CeloTransactionCip66).maxFeeInFeeCurrency);
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
