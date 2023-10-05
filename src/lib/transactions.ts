import {
  BigNumber,
  BytesLike,
  constants,
  providers,
  Signature,
  Transaction,
  utils,
} from "ethers";
import { concatHex, isCIP64, isEIP1559, omit } from "./transaction/utils";
import { accessListify, AccessListish } from "ethers/lib/utils";
import { EIGHT, EIP155_NUMBER, Y_PARITY_EIP_2098 } from "../consts";

// From https://github.com/ethers-io/ethers.js/blob/master/packages/bytes/src.ts/index.ts#L33
// Copied because it doesn't seem to be exported from 'ethers' anywhere
type SignatureLike =
  | {
      r: string;
      s?: string;
      _vs?: string;
      recoveryParam?: number;
      v?: number;
    }
  | BytesLike;

const logger = new utils.Logger("celo/transactions");

export interface CeloTransactionRequest extends providers.TransactionRequest {
  feeCurrency?: string;
  gatewayFeeRecipient?: string;
  gatewayFee?: string;
}

export interface CeloTransactionCip64 extends Transaction {
  type: TxTypeToPrefix.cip64;
  feeCurrency: string;
}

export interface CeloTransactionEip1559 extends Transaction {
  type: TxTypeToPrefix.eip1559;
}
export interface LegacyCeloTransaction extends Transaction {
  type: undefined;
  gasPrice: BigNumber;
  feeCurrency: string;
  gatewayFeeRecipient: string;
  gatewayFee: BigNumber;
}

export type CeloTransaction =
  | LegacyCeloTransaction
  | CeloTransactionCip64
  | CeloTransactionEip1559;

export enum TxTypeToPrefix {
  cip64 = 0x7b,
  eip1559 = 0x02,
}

interface Field {
  maxLength?: number;
  length?: number;
  numeric?: true;
  deprecated?: true;
}
export const celoAllowedTransactionKeys = {
  type: true,
  chainId: true,
  data: true,
  gasLimit: true,
  gasPrice: true,
  nonce: true,
  to: true,
  value: true,
  feeCurrency: true,
  gatewayFeeRecipient: true,
  gatewayFee: true,
  maxFeePerGas: true,
  maxPriorityFeePerGas: true,
  accessList: true,
} as const;

type CeloFieldName =
  | keyof Omit<
      CeloTransactionRequest,
      | "type"
      | "chainId"
      | "r"
      | "s"
      | "v"
      | "hash"
      | "accessList"
      | "from"
      | "customData"
      | "ccipReadEnabled"
    >
  | "feeCurrency"
  | "gatewayFeeRecipient"
  | "gatewayFee";

export const celoTransactionFields: Record<CeloFieldName, Field> = {
  nonce: { maxLength: 32, numeric: true } as Field,
  gasPrice: { maxLength: 32, numeric: true } as Field,
  gasLimit: { maxLength: 32, numeric: true } as Field,
  feeCurrency: { length: 20 } as Field,
  gatewayFeeRecipient: { length: 20 } as Field,
  gatewayFee: { maxLength: 32, numeric: true } as Field,
  to: { length: 20 } as Field,
  value: { maxLength: 32, numeric: true } as Field,
  data: {} as Field,
  maxFeePerGas: { maxLength: 32, numeric: true } as Field,
  maxPriorityFeePerGas: { maxLength: 32, numeric: true } as Field,
} as const;

function formatCeloField(name: CeloFieldName, value: any) {
  value = value || [];

  const fieldInfo = celoTransactionFields[name];
  const options: any = {};
  if (fieldInfo.numeric) {
    options.hexPad = "left";
  }
  value = utils.arrayify(utils.hexlify(value, options));

  // Fixed-width field
  if (
    fieldInfo.length &&
    value.length !== fieldInfo.length &&
    value.length > 0
  ) {
    logger.throwArgumentError(
      "invalid length for " + name,
      "transaction:" + name,
      value
    );
  }

  // Variable-width (with a maximum)
  if (fieldInfo.maxLength) {
    value = utils.stripZeros(value);
    if (value.length > fieldInfo.maxLength) {
      logger.throwArgumentError(
        "invalid length for " + name,
        "transaction:" + name,
        value
      );
    }
  }

  return utils.hexlify(value);
}

export function getTxType(tx: CeloTransaction) {
  if (isCIP64(tx)) {
    // @ts-ignore
    delete tx.gatewayFee;
    // @ts-ignore
    delete tx.gatewayFeeRecipient;
    // @ts-ignore
    delete tx.gasPrice;
    return TxTypeToPrefix.cip64;
  } else if (isEIP1559(tx)) {
    // @ts-ignore
    delete tx.feeCurrency;
    // @ts-ignore
    delete tx.gatewayFee;
    // @ts-ignore
    delete tx.gatewayFeeRecipient;
    // @ts-ignore
    delete tx.gasPrice;
    return TxTypeToPrefix.eip1559;
  } else {
    return "";
  }
}

function prepareEncodeTx(
  tx: CeloTransaction,
  signature?: Signature
): (string | Uint8Array)[] {
  let raw: (string | Uint8Array)[] = [];
  switch (tx.type) {
    case TxTypeToPrefix.cip64:
      // https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md
      // 0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, feeCurrency, signatureYParity, signatureR, signatureS]).
      raw = [
        utils.hexlify(tx.chainId!), // NOTE: is this safe or nah?
        utils.hexlify(tx.nonce!), // NOTE: is this safe or nah?
        tx.maxPriorityFeePerGas ? utils.hexlify(tx.maxPriorityFeePerGas) : "0x",
        tx.maxFeePerGas ? utils.hexlify(tx.maxFeePerGas) : "0x",
        tx.gasLimit ? utils.hexlify(tx.gasLimit) : "0x",
        tx.to || "0x",
        tx.value ? utils.hexlify(tx.value) : "0x",
        tx.data || "0x",
        // @ts-expect-error
        tx.accessList || [],
        tx.feeCurrency || "0x",
      ];
      break;
    case TxTypeToPrefix.eip1559:
      // https://eips.ethereum.org/EIPS/eip-1559
      // 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
      raw = [
        utils.hexlify(tx.chainId!),
        utils.hexlify(tx.nonce!),
        tx.maxPriorityFeePerGas ? utils.hexlify(tx.maxPriorityFeePerGas) : "0x",
        tx.maxFeePerGas ? utils.hexlify(tx.maxFeePerGas) : "0x",
        tx.gasLimit ? utils.hexlify(tx.gasLimit) : "0x",
        tx.to || "0x",
        tx.value ? utils.hexlify(tx.value) : "0x",
        tx.data || "0x",
        // @ts-expect-error
        tx.accessList || [],
      ];
      break;
    default:
      // This order should match the order in Geth.
      // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
      raw = [
        utils.hexlify(tx.nonce!),
        tx.gasPrice ? utils.hexlify(tx.gasPrice) : "0x",
        tx.gasLimit ? utils.hexlify(tx.gasLimit) : "0x",
        tx.feeCurrency || "0x",
        tx.gatewayFeeRecipient || "0x",
        tx.gatewayFee ? utils.hexlify(tx.gatewayFee) : "0x",
        tx.to || "0x",
        tx.value ? utils.hexlify(tx.value) : "0x",
        tx.data || "0x",
      ];
      if (!signature) {
        raw.push(...[utils.hexlify(tx.chainId!), "0x", "0x"]);
      }
      break;
  }

  if (signature) {
    raw.push(
      ...[
        // NOTE: Somehow geth cannot parse `0x00` because it's dumb
        signature.v ? utils.hexlify(signature.v) : "0x",
        utils.stripZeros(utils.arrayify(signature.r)),
        utils.stripZeros(utils.arrayify(signature.s)),
      ]
    );
  }

  return raw;
}

// Almost identical to https://github.com/ethers-io/ethers.js/blob/master/packages/transactions/src.ts/index.ts#L85
// Need to override to use the celo tx prop whitelists above
export function serializeCeloTransaction(
  transaction: CeloTransactionRequest,
  signature?: SignatureLike
): string {
  utils.checkProperties(transaction, celoAllowedTransactionKeys);

  const txArgs: Partial<Record<keyof CeloTransaction, string | Uint8Array>> =
    {};

  Object.entries(transaction).forEach(([fieldName, fieldValue]) => {
    if (fieldName in celoTransactionFields) {
      // @ts-expect-error
      txArgs[fieldName as CeloFieldName] = formatCeloField(
        fieldName as CeloFieldName,
        fieldValue
      );
    }
  });

  let chainId = 0;
  if (transaction.chainId != null) {
    // A chainId was provided; if non-zero we'll use EIP-155
    chainId = transaction.chainId;

    if (typeof chainId !== "number") {
      logger.throwArgumentError(
        "invalid transaction.chainId",
        "transaction",
        transaction
      );
    }
  } else if (
    signature &&
    !utils.isBytesLike(signature) &&
    signature.v &&
    signature.v > 28
  ) {
    // No chainId provided, but the signature is signing with EIP-155; derive chainId
    chainId = Math.floor((signature.v - EIP155_NUMBER) / 2);
  }

  // We have an EIP-155 transaction (chainId was specified and non-zero)
  if (chainId !== 0) {
    txArgs["chainId"] = utils.hexlify(chainId); // @TODO: hexValue?
  }

  // Requesting an unsigned transation
  // @ts-ignore
  const type = getTxType(txArgs);
  // @ts-expect-error
  txArgs.type = type;
  if (!signature) {
    // @ts-expect-error
    const raw = prepareEncodeTx(txArgs);
    const encoded = utils.RLP.encode(raw);
    return type ? concatHex([utils.hexlify(type), encoded]) : encoded;
  }

  // The splitSignature will ensure the transaction has a recoveryParam in the
  // case that the signTransaction function only adds a v.
  const sig = utils.splitSignature(signature);

  let v: number;
  if (txArgs.type) {
    // cip64, eip-1559
    v = sig.v - Y_PARITY_EIP_2098;
  } else {
    // celo-legacy
    v = Y_PARITY_EIP_2098 + sig.recoveryParam;

    if (chainId !== 0) {
      v += chainId * 2 + EIGHT;

      // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
      if (sig.v > Y_PARITY_EIP_2098 + 1 && sig.v !== v) {
        logger.throwArgumentError(
          "transaction.chainId/signature.v mismatch",
          "signature",
          signature
        );
      }
    } else if (sig.v !== v) {
      logger.throwArgumentError(
        "transaction.chainId/signature.v mismatch",
        "signature",
        signature
      );
    }
  }

  // @ts-expect-error
  const raw = prepareEncodeTx(txArgs, { ...sig, v });
  const encoded = utils.RLP.encode(raw);
  return type ? concatHex([utils.hexlify(type), encoded]) : encoded;
}

// Based on https://github.com/ethers-io/ethers.js/blob/0234cfbbef76b7f7a53efe4c434cc6d8892bf404/packages/transactions/src.ts/index.ts#L165
// Need to override to use the celo tx prop whitelists above
export function parseCeloTransaction(
  rawTransaction: utils.BytesLike
): CeloTransaction {
  const [type, transaction] = splitTypeAndRawTx(rawTransaction);

  let tx: CeloTransaction;
  switch (type!) {
    case TxTypeToPrefix.cip64:
      tx = {
        type: TxTypeToPrefix.cip64,
        chainId: handleNumber(transaction[0]).toNumber(),
        nonce: handleNumber(transaction[1]).toNumber(),
        maxPriorityFeePerGas: handleNumber(transaction[2]),
        maxFeePerGas: handleNumber(transaction[3]),
        gasLimit: handleNumber(transaction[4]),
        to: handleAddress(transaction[5]),
        value: handleNumber(transaction[6]),
        data: transaction[7],
        accessList: handleAccessList(transaction[8]),
        feeCurrency: handleAddress(transaction[9]),
      } as CeloTransactionCip64;
      break;
    case TxTypeToPrefix.eip1559:
      // untested
      tx = {
        type: TxTypeToPrefix.eip1559,
        chainId: handleNumber(transaction[0]).toNumber(),
        nonce: handleNumber(transaction[1]).toNumber(),
        maxPriorityFeePerGas: handleNumber(transaction[2]),
        maxFeePerGas: handleNumber(transaction[3]),
        gasLimit: handleNumber(transaction[4]),
        to: handleAddress(transaction[5]),
        value: handleNumber(transaction[6]),
        data: transaction[7],
        accessList: handleAccessList(transaction[8]),
      } as CeloTransactionEip1559;
      break;
    default:
      tx = {
        nonce: handleNumber(transaction[0]).toNumber(),
        gasPrice: handleNumber(transaction[1]),
        gasLimit: handleNumber(transaction[2]),
        feeCurrency: handleAddress(transaction[3]),
        gatewayFeeRecipient: handleAddress(transaction[4]),
        gatewayFee: handleNumber(transaction[5]),
        to: handleAddress(transaction[6]),
        value: handleNumber(transaction[7]),
        data: transaction[8],
        chainId: handleNumber(transaction[9]).toNumber(),
      } as LegacyCeloTransaction;
      break;
  }

  // Legacy unsigned transaction
  if (!isSigned(type!, transaction)) {
    return tx;
  }

  try {
    tx.v = handleNumber(transaction.at(-3)).toNumber();
  } catch (error) {
    console.log(error);
    return tx;
  }

  tx.r = utils.hexZeroPad(transaction.at(-2), 32);
  tx.s = utils.hexZeroPad(transaction.at(-1), 32);

  // EIP-155 unsigned transaction
  if (handleNumber(tx.r).isZero() && handleNumber(tx.s).isZero()) {
    if (!type) {
      tx.chainId = tx.v;
      tx.v = 0;
    }
  }
  // Signed Transaction
  else {
    let recoveryParam = tx.v;
    if (!type) {
      // celo-legacy
      tx.chainId = Math.max(0, Math.floor((tx.v - EIP155_NUMBER) / 2));
      recoveryParam = tx.v - Y_PARITY_EIP_2098;
      recoveryParam -= tx.chainId * 2 + EIGHT;
    }

    // NOTE: Serialization needs to happen here because chainId may not populated before
    const serialized = serializeCeloTransaction(
      omit(tx, "v", "r", "s") as CeloTransactionRequest
    );
    const digest = utils.keccak256(serialized);

    try {
      // TODO there may be an issue here with incorrect from address extraction
      tx.from = utils.recoverAddress(digest, {
        r: utils.hexlify(tx.r),
        s: utils.hexlify(tx.s),
        recoveryParam,
      });
    } catch (error) {
      console.log(error);
    }

    tx.hash = utils.keccak256(rawTransaction);
  }

  return tx;
}

function handleAddress(value: string): string | undefined {
  if (value === "0x") {
    return undefined;
  }
  try {
    return utils.getAddress(value);
  } catch (error) {
    return value;
  }
}

function handleNumber(value: string): BigNumber {
  if (value === "0x") {
    return constants.Zero;
  }
  return BigNumber.from(value);
}

function handleAccessList(value: string): AccessListish | "0x" {
  if (value === "0x") {
    return accessListify([]);
  }
  // TODO: use value
  return accessListify([]);
}

const baseTxLengths = {
  [TxTypeToPrefix.cip64]: { unsigned: 10, signed: 13 },
  [TxTypeToPrefix.eip1559]: { unsigned: 9, signed: 12 },
  "celo-legacy": { unsigned: 12, signed: 12 },
} as const;

function isSigned(type: TxTypeToPrefix, transaction: string[]) {
  if (type) {
    const { signed } = baseTxLengths[type];
    return transaction.length === signed;
  }

  const r = transaction.at(-2) || "0x";
  const s = transaction.at(-1) || "0x";
  return r !== "0x" && s !== "0x";
}

function isCorrectLength(type: TxTypeToPrefix, transaction: string[]) {
  const { unsigned } = baseTxLengths[type || "celo-legacy"];
  return transaction.length === unsigned || isSigned(type, transaction);
}

function splitTypeAndRawTx(
  rawTransaction: utils.BytesLike
): [TxTypeToPrefix | undefined, any[]] {
  let rawStr = rawTransaction.toString();
  let type: TxTypeToPrefix | undefined;
  for (const _type of [TxTypeToPrefix.cip64, TxTypeToPrefix.eip1559]) {
    const prefix = utils.hexlify(_type);
    if (rawStr.startsWith(prefix)) {
      rawStr = `0x${rawStr.slice(prefix.length)}`;
      type = _type;
      break;
    }
  }

  const transaction = utils.RLP.decode(rawStr);
  if (!isCorrectLength(type!, transaction)) {
    logger.throwArgumentError(
      "invalid raw transaction",
      "{type, rawTransaction}",
      { type: type!, rawTransaction }
    );
  }

  return [type!, transaction];
}
