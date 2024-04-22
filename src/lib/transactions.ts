import {
  accessListify,
  AccessListish,
  assertArgument,
  BytesLike,
  decodeRlp,
  encodeRlp,
  getAddress,
  getBigInt,
  getBytes,
  getNumber,
  hexlify,
  isBytesLike,
  keccak256,
  recoverAddress,
  RlpStructuredData,
  Signature,
  SignatureLike,
  stripZerosLeft,
  toBeArray,
  toBeHex,
  TransactionLike,
  TransactionRequest,
  zeroPadValue,
} from "ethers";
import { concatHex, isCIP64, isEIP1559, isFeeCurrency } from "./transaction/utils";
import { EIGHT, EIP155_NUMBER, Y_PARITY_EIP_2098 } from "../consts";

export interface CeloTransactionRequest extends TransactionRequest {
  feeCurrency?: string;
}

export interface CeloTransactionCip64 extends TransactionLike {
  type: TxTypeToPrefix.cip64;
  feeCurrency: string;
}

export interface CeloTransactionEip1559 extends TransactionLike {
  type: TxTypeToPrefix.eip1559;
}

export type CeloTransaction =
  | CeloTransactionCip64
  | CeloTransactionEip1559
  | TransactionLike;

export enum TxTypeToPrefix {
  cip64 = 0x7b,
  eip1559 = 0x02,
}

interface Field {
  maxLength?: number;
  length?: number;
  numeric?: true;
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
      | "blockTag"
      | "enableCcipRead"
    >
  | "feeCurrency";

export const celoTransactionFields: Record<CeloFieldName, Field> = {
  nonce: { maxLength: 32, numeric: true } as Field,
  gasPrice: { maxLength: 32, numeric: true } as Field,
  gasLimit: { maxLength: 32, numeric: true } as Field,
  feeCurrency: { length: 20 } as Field,
  to: { length: 20 } as Field,
  value: { maxLength: 32, numeric: true } as Field,
  data: {} as Field,
  maxFeePerGas: { maxLength: 32, numeric: true } as Field,
  maxPriorityFeePerGas: { maxLength: 32, numeric: true } as Field,
} as const;

function formatCeloField(name: CeloFieldName, value: any) {
  const fieldInfo = celoTransactionFields[name];
  const options: any = {};

  if (!value || value === "0x") return value;

  if (fieldInfo.numeric) {
    options.hexPad = "left";
    value = value ? toBeHex(value, fieldInfo.maxLength) : "0x";
  } else {
    value = hexlify(value);
  }

  let _value = toBeArray(value);

  // Fixed-width field
  if (
    fieldInfo.length &&
    _value.length !== fieldInfo.length &&
    _value.length > 0
  ) {
    assertArgument(
      false,
      "invalid length for " + name,
      "transaction:" + name,
      _value
    );
  }

  // Variable-width (with a maximum)
  if (fieldInfo.maxLength) {
    _value = toBeArray(stripZerosLeft(_value));
    if (_value.length > fieldInfo.maxLength) {
      assertArgument(
        false,
        "invalid length for " + name,
        "transaction:" + name,
        _value
      );
    }
  }

  return hexlify(_value);
}

export function getTxType(tx: CeloTransaction) {
  if (isCIP64(tx)) {
    return TxTypeToPrefix.cip64;
  }
  if (isFeeCurrency(tx)) {
    return TxTypeToPrefix.cip64;
  }
  if (isEIP1559(tx)) {
    // @ts-ignore
    delete tx.feeCurrency;
    // @ts-ignore
    delete tx.gatewayFee;
    // @ts-ignore
    delete tx.gatewayFeeRecipient;
    // @ts-ignore
    delete tx.gasPrice;
    return TxTypeToPrefix.eip1559;
  }
  return "";
}

function prepareEncodeTx(
  tx: CeloTransaction,
  signature?: Signature
): RlpStructuredData {
  let raw: RlpStructuredData[] = [];
  switch (tx.type) {
    case TxTypeToPrefix.cip64:
      // https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md
      // 0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, feeCurrency, signatureYParity, signatureR, signatureS]).
      raw = [
        toBeHex(tx.chainId!),
        toBeHex(tx.nonce!),
        tx.maxPriorityFeePerGas ? toBeHex(tx.maxPriorityFeePerGas) : "0x",
        tx.maxFeePerGas ? toBeHex(tx.maxFeePerGas) : "0x",
        tx.gasLimit ? toBeHex(tx.gasLimit) : "0x",
        tx.to || "0x",
        tx.value ? toBeHex(tx.value) : "0x",
        tx.data || "0x",
        // @ts-expect-error
        tx.accessList || [],
        (tx as CeloTransactionCip64).feeCurrency || "0x",
      ];
      break;
    case TxTypeToPrefix.eip1559:
      // https://eips.ethereum.org/EIPS/eip-1559
      // 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
      raw = [
        toBeHex(tx.chainId!),
        toBeHex(tx.nonce!),
        tx.maxPriorityFeePerGas ? toBeHex(tx.maxPriorityFeePerGas) : "0x",
        tx.maxFeePerGas ? toBeHex(tx.maxFeePerGas) : "0x",
        tx.gasLimit ? toBeHex(tx.gasLimit) : "0x",
        tx.to || "0x",
        tx.value ? toBeHex(tx.value) : "0x",
        tx.data || "0x",
        // @ts-expect-error
        tx.accessList || [],
      ];
      break;
    default:
      // Type 0 Ethereum legacy transaction:
      // rlp([nonce, gasprice, gaslimit, recipient, amount, data, v, r, s])
      raw = [
        toBeHex(tx.nonce!),
        tx.gasPrice ? toBeHex(tx.gasPrice) : "0x",
        tx.gasLimit ? toBeHex(tx.gasLimit) : "0x",
        tx.to || "0x",
        tx.value ? toBeHex(tx.value) : "0x",
        tx.data || "0x",
      ];
      if (!signature) {
        raw.push(...[toBeHex(tx.chainId!), "0x", "0x"]);
      }
      break;
  }

  if (signature) {
    raw.push(
      ...[
        // NOTE: Somehow geth cannot parse `0x00` because it's dumb
        signature.v ? toBeHex(signature.v) : "0x",
        stripZerosLeft(getBytes(signature.r)),
        stripZerosLeft(getBytes(signature.s)),
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
  Object.keys(transaction).forEach((property) => {
    if (!(property in celoAllowedTransactionKeys)) {
      assertArgument(
        false,
        "unknown property",
        "serializeCeloTransaction",
        property
      );
    }
  });

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
    chainId = parseInt(transaction.chainId.toString(16), 16);

    if (typeof chainId !== "number") {
      assertArgument(
        false,
        "invalid transaction.chainId",
        "transaction",
        transaction
      );
    }
  } else if (
    signature &&
    !isBytesLike(signature) &&
    signature.v &&
    getNumber(signature.v) > 28
  ) {
    // No chainId provided, but the signature is signing with EIP-155; derive chainId
    chainId = Math.floor((getNumber(signature.v) - EIP155_NUMBER) / 2);
  }

  // We have an EIP-155 transaction (chainId was specified and non-zero)
  if (chainId !== 0) {
    txArgs["chainId"] = toBeHex(chainId); // @TODO: hexValue?
  }

  // Requesting an unsigned transation
  // @ts-ignore
  const type = getTxType(txArgs);
  // @ts-expect-error
  txArgs.type = type;
  if (!signature) {
    // @ts-expect-error
    const raw = prepareEncodeTx(txArgs);
    const encoded = encodeRlp(raw);
    return type ? concatHex([toBeHex(type), encoded]) : encoded;
  }

  // The splitSignature will ensure the transaction has a recoveryParam in the
  // case that the signTransaction function only adds a v.
  const sig = Signature.from(signature);

  let v: number;
  if (txArgs.type) {
    // cip64, eip-1559
    v = sig.v - Y_PARITY_EIP_2098;
  } else {
    // celo-legacy
    v = Y_PARITY_EIP_2098 + sig.yParity;

    if (chainId !== 0) {
      v += chainId * 2 + EIGHT;

      // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
      if (sig.v > Y_PARITY_EIP_2098 + 1 && sig.v !== v) {
        assertArgument(
          false,
          "transaction.chainId/signature.v mismatch",
          "signature",
          signature
        );
      }
    } else if (sig.v !== v) {
      assertArgument(
        false,
        "transaction.chainId/signature.v mismatch",
        "signature",
        signature
      );
    }
  }

  // @ts-expect-error
  const raw = prepareEncodeTx(txArgs, { ...sig.toJSON(), v });
  const encoded = encodeRlp(raw);
  return type ? concatHex([toBeHex(type), encoded]) : encoded;
}

// Based on https://github.com/ethers-io/ethers.js/blob/0234cfbbef76b7f7a53efe4c434cc6d8892bf404/packages/transactions/src.ts/index.ts#L165
// Need to override to use the celo tx prop whitelists above
export function parseCeloTransaction(
  rawTransaction: BytesLike
): CeloTransaction {
  const [type, transaction] = splitTypeAndRawTx(rawTransaction);

  let tx: CeloTransaction;
  switch (type!) {
    case TxTypeToPrefix.cip64:
      tx = {
        type: TxTypeToPrefix.cip64,
        chainId: handleNumber(transaction[0] as string),
        nonce: handleNumber(transaction[1] as string),
        maxPriorityFeePerGas: handleBigInt(transaction[2] as string),
        maxFeePerGas: handleBigInt(transaction[3] as string),
        gasLimit: handleBigInt(transaction[4] as string),
        to: handleAddress(transaction[5] as string),
        value: handleBigInt(transaction[6] as string),
        data: transaction[7],
        accessList: handleAccessList(transaction[8] as string),
        feeCurrency: handleAddress(transaction[9] as string),
      } as CeloTransactionCip64;
      break;
    case TxTypeToPrefix.eip1559:
      // untested
      tx = {
        type: TxTypeToPrefix.eip1559,
        chainId: handleNumber(transaction[0] as string),
        nonce: handleNumber(transaction[1] as string),
        maxPriorityFeePerGas: handleBigInt(transaction[2] as string),
        maxFeePerGas: handleBigInt(transaction[3] as string),
        gasLimit: handleBigInt(transaction[4] as string),
        to: handleAddress(transaction[5] as string),
        value: handleBigInt(transaction[6] as string),
        data: transaction[7] as string,
        accessList: handleAccessList(transaction[8] as string),
      } as CeloTransactionEip1559;
      break;
    default:
        /**
         * Type 0 Ethereum legacy transaction:
         * RLP([nonce, gasprice, gaslimit, recipient, amount, data, chaindId, 0, 0])
         */
      tx = {
        nonce: handleNumber(transaction[0] as string),
        gasPrice: handleBigInt(transaction[1] as string),
        gasLimit: handleBigInt(transaction[2] as string),
        to: handleAddress(transaction[3] as string),
        value: handleBigInt(transaction[4] as string),
        data: transaction[5] as string,
        chainId: handleBigInt(transaction[6] as string),
      } as TransactionLike;
      break;
  }

  // Legacy unsigned transaction
  if (!isSigned(type!, transaction)) { 
    return tx;
  }

  let v: number;
  try {
    v = handleNumber(transaction.at(-3) as string);
  } catch (error) {
    console.log(error);
    return tx;
  }

  const r = zeroPadValue(transaction.at(-2) as string, 32);
  const s = zeroPadValue(transaction.at(-1) as string, 32);

  // EIP-155 unsigned transaction
  if (handleBigInt(r) === 0n && handleBigInt(s) === 0n) {
    if (!type) {
      tx.chainId = v;
      v = 0;
    }
  }
  // Signed Transaction
  else {
    let recoveryParam = v;
    if (!type) {
      // celo-legacy
      tx.chainId = Math.max(0, Math.floor((v - EIP155_NUMBER) / 2));
      recoveryParam = v - Y_PARITY_EIP_2098;
      recoveryParam -= tx.chainId * 2 + EIGHT;
    }

    // NOTE: Serialization needs to happen here because chainId may not populated before
    const serialized = serializeCeloTransaction(tx);
    const digest = keccak256(serialized);

    try {
      tx.from = recoverAddress(digest, {
        r,
        s,
        yParity: recoveryParam as 0 | 1,
      });
    } catch (error) {
      console.log(error);
    }

    tx.hash = keccak256(rawTransaction);
  }

  return tx;
}

function handleAddress(value: string): string | undefined {
  if (value === "0x") {
    return undefined;
  }
  try {
    return getAddress(value);
  } catch (error) {
    return value;
  }
}

function handleNumber(value: string): number {
  if (value === "0x") {
    return 0;
  }
  return getNumber(value);
}

function handleBigInt(value: string): bigint {
  if (value === "0x") {
    return 0n;
  }
  return getBigInt(value);
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
  /**
   * Unsigned: RLP([nonce, gasprice, gaslimit, recipient, amount, data, chaindId, 0, 0])
   * Signed: RLP([nonce, gasprice, gaslimit, recipient, amount, data, v, r, s])
   * Source: https://github.com/celo-org/txtypes?tab=readme-ov-file#legacy-transactions
   */
  "ethereum-legacy": { unsigned: 9, signed: 9 },
} as const;

function isSigned(type: TxTypeToPrefix, transaction: RlpStructuredData[]) {
  if (type) {
    const { signed } = baseTxLengths[type];
    return transaction.length === signed;
  }

  const r = transaction.at(-2) || "0x";
  const s = transaction.at(-1) || "0x";
  return r !== "0x" && s !== "0x";
}

function isCorrectLength(
  type: TxTypeToPrefix,
  transaction: RlpStructuredData[]
) {
  const { unsigned } = baseTxLengths[type || "ethereum-legacy"];
  return transaction.length === unsigned || isSigned(type, transaction);
}

function splitTypeAndRawTx(
  rawTransaction: BytesLike
): [TxTypeToPrefix | undefined, RlpStructuredData[]] {
  let rawStr = rawTransaction.toString();
  let type: TxTypeToPrefix | undefined;
  for (const _type of [TxTypeToPrefix.cip64, TxTypeToPrefix.eip1559]) {
    const prefix = toBeHex(_type);
    if (rawStr.startsWith(prefix)) {
      rawStr = `0x${rawStr.slice(prefix.length)}`;
      type = _type;
      break;
    }
  }

  const transaction = decodeRlp(rawStr) as RlpStructuredData[];
  if (!isCorrectLength(type!, transaction)) {
    assertArgument(false, "invalid raw transaction", "{type, rawTransaction}", {
      type: type!,
      rawTransaction,
    });
  }

  return [type!, transaction];
}
