import {
  BigNumber,
  BigNumberish,
  BytesLike,
  constants,
  providers,
  Transaction,
  utils,
} from "ethers";
import { TransactionResponse } from "@ethersproject/providers"


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
  gatewayFee?: BigNumberish;
}

export interface CeloTransaction extends Transaction {
  feeCurrency?: string;
  gatewayFeeRecipient?: string;
  gatewayFee?: BigNumber;
}

export type CeloTransactionResponse = CeloTransaction & TransactionResponse

export const celoTransactionFields = [
  { name: "nonce", maxLength: 32, numeric: true },
  { name: "gasPrice", maxLength: 32, numeric: true },
  { name: "gasLimit", maxLength: 32, numeric: true },
  { name: "feeCurrency", length: 20 },
  { name: "gatewayFeeRecipient", length: 20 },
  { name: "gatewayFee", maxLength: 32, numeric: true },
  { name: "to", length: 20 },
  { name: "value", maxLength: 32, numeric: true },
  { name: "data" },
];

export const celoAllowedTransactionKeys: { [key: string]: boolean } = {
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
};

// Almost identical to https://github.com/ethers-io/ethers.js/blob/master/packages/transactions/src.ts/index.ts#L85
// Need to override to use the celo tx prop whitelists above
export function serializeCeloTransaction(
  transaction: any,
  signature?: SignatureLike
): string {
  utils.checkProperties(transaction, celoAllowedTransactionKeys);

  const raw: Array<string | Uint8Array> = [];

  celoTransactionFields.forEach(function (fieldInfo) {
    let value = (<any>transaction)[fieldInfo.name] || [];
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
        "invalid length for " + fieldInfo.name,
        "transaction:" + fieldInfo.name,
        value
      );
    }

    // Variable-width (with a maximum)
    if (fieldInfo.maxLength) {
      value = utils.stripZeros(value);
      if (value.length > fieldInfo.maxLength) {
        logger.throwArgumentError(
          "invalid length for " + fieldInfo.name,
          "transaction:" + fieldInfo.name,
          value
        );
      }
    }

    raw.push(utils.hexlify(value));
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
    chainId = Math.floor((signature.v - 35) / 2);
  }

  // We have an EIP-155 transaction (chainId was specified and non-zero)
  if (chainId !== 0) {
    raw.push(utils.hexlify(chainId)); // @TODO: hexValue?
    raw.push("0x");
    raw.push("0x");
  }

  // Requesting an unsigned transation
  if (!signature) {
    return utils.RLP.encode(raw);
  }

  // The splitSignature will ensure the transaction has a recoveryParam in the
  // case that the signTransaction function only adds a v.
  const sig = utils.splitSignature(signature);

  // We pushed a chainId and null r, s on for hashing only; remove those
  let v = 27 + sig.recoveryParam;
  if (chainId !== 0) {
    raw.pop();
    raw.pop();
    raw.pop();
    v += chainId * 2 + 8;

    // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
    if (sig.v > 28 && sig.v !== v) {
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

  raw.push(utils.hexlify(v));
  raw.push(utils.stripZeros(utils.arrayify(sig.r)));
  raw.push(utils.stripZeros(utils.arrayify(sig.s)));

  return utils.RLP.encode(raw);
}

// Based on https://github.com/ethers-io/ethers.js/blob/0234cfbbef76b7f7a53efe4c434cc6d8892bf404/packages/transactions/src.ts/index.ts#L165
// Need to override to use the celo tx prop whitelists above
export function parseCeloTransaction(
  rawTransaction: utils.BytesLike
): CeloTransaction {
  const transaction = utils.RLP.decode(rawTransaction);

  if (transaction.length !== 12 && transaction.length !== 9) {
    logger.throwArgumentError(
      "invalid raw transaction",
      "rawTransaction",
      rawTransaction
    );
  }

  const tx: CeloTransaction = {
    nonce: handleNumber(transaction[0]).toNumber(),
    gasPrice: handleNumber(transaction[1]),
    gasLimit: handleNumber(transaction[2]),
    feeCurrency: handleAddress(transaction[3]),
    gatewayFeeRecipient: handleAddress(transaction[4]),
    gatewayFee: handleNumber(transaction[5]),
    to: handleAddress(transaction[6]),
    value: handleNumber(transaction[7]),
    data: transaction[8],
    chainId: 0,
  };

  // Legacy unsigned transaction
  if (transaction.length === 9) {
    return tx;
  }

  try {
    tx.v = BigNumber.from(transaction[9]).toNumber();
  } catch (error) {
    console.log(error);
    return tx;
  }

  tx.r = utils.hexZeroPad(transaction[10], 32);
  tx.s = utils.hexZeroPad(transaction[11], 32);

  if (BigNumber.from(tx.r).isZero() && BigNumber.from(tx.s).isZero()) {
    // EIP-155 unsigned transaction
    tx.chainId = tx.v;
    tx.v = 0;
  } else {
    // Signed Tranasaction

    tx.chainId = Math.floor((tx.v - 35) / 2);
    if (tx.chainId < 0) {
      tx.chainId = 0;
    }

    let recoveryParam = tx.v - 27;

    const raw = transaction.slice(0, 6);

    if (tx.chainId !== 0) {
      raw.push(utils.hexlify(tx.chainId));
      raw.push("0x");
      raw.push("0x");
      recoveryParam -= tx.chainId * 2 + 8;
    }

    const digest = utils.keccak256(utils.RLP.encode(raw));
    try {
      // TODO there may be an issue here with incorrect from address extraction
      tx.from = utils.recoverAddress(digest, {
        r: utils.hexlify(tx.r),
        s: utils.hexlify(tx.s),
        recoveryParam: recoveryParam,
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
