import { hexlify, BigNumberish, isBytesLike, toBeHex } from "ethers";
import { GAS_INFLATION_FACTOR } from "../../consts";
import {
  CeloTransaction,
  CeloTransactionCip64,
  CeloTransactionCip66,
} from "../transactions";

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

export function isCIP64(tx: CeloTransaction): tx is CeloTransactionCip64 {
  return (
    isPresent((tx as CeloTransactionCip64).feeCurrency) &&
    isEmpty((tx as CeloTransactionCip66).maxFeeInFeeCurrency)
  );
}

export function isCIP66(tx: CeloTransaction): tx is CeloTransactionCip66 {
  return (
    isPresent((tx as CeloTransactionCip66).feeCurrency) &&
    isPresent((tx as CeloTransactionCip66).maxFeeInFeeCurrency)
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

export function adjustForGasInflation(gas: bigint): bigint {
  // NOTE: prevent floating point math
  return (gas * GAS_INFLATION_FACTOR) / 100n;
}

interface ConversionParams {
  amountInCelo: bigint;
  ratioCELO: bigint;
  ratioTOKEN: bigint;
}
/**
 * 
 * @param param0 @ConversionParams
 *  ratioTOKEN will come from the first position (or numerator) of tuple returned from SortedOracles.medianRate 
 *  ratioCELO will come from the second position (or denominator) of tuple returned from SortedOracles.medianRate 
 
 * @returns amount in token equal in value to the amountInCelo given. 
 */
export function convertFromCeloToToken({
  amountInCelo,
  ratioCELO,
  ratioTOKEN,
}: ConversionParams) {
  return (amountInCelo * ratioCELO) / ratioTOKEN;
}
