
import { Signer, TypedDataDomain, TypedDataField, TypedDataSigner } from "@ethersproject/abstract-signer";
import { JsonRpcSigner, Provider } from "@ethersproject/providers"
import { utils } from "ethers"
import { Bytes, isHexString } from "ethers/lib/utils"
import { CeloProvider } from "./CeloProvider"
import {  Deferrable, defineReadOnly, shallowCopy, resolveProperties } from "@ethersproject/properties";

import {
CeloTransactionRequest,
CeloTransactionResponse,
} from "./transactions";

const Logger = utils.Logger

const logger = new Logger("CeloRpcSigner");
const jsonRpcPrototype = JsonRpcSigner.prototype

const allowedTransactionKeys: Array<string> = [
    "accessList",
    "ccipReadEnabled",
    "chainId",
    "customData",
    "data",
    "feeCurrency",
    "from",
    "gasLimit",
    "gasPrice",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
    "nonce",
    "to",
    "type",
    "value",
];

/*
 * @internal
 */
export const _constructorGuard = {}


/*
 * This is essentially ethers JsonRPC signer with the ability to add feeCurrency to transactions
 *
 */
export class CeloJsonRpcSigner extends Signer implements TypedDataSigner {
    _index!: number
    _address!: string

    // copied from https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts#L163
    constructor(constructorGuard: any, readonly provider: CeloProvider, addressOrIndex?: string | number) {
        super();

        if (constructorGuard !== _constructorGuard) {
            throw new Error("do not call the CeloJsonRpcSigner constructor directly; use CeloProvider.getCeloSigner");
        }

        defineReadOnly(this, "provider", provider);

        if (addressOrIndex == null) { addressOrIndex = 0; }

        if (typeof(addressOrIndex) === "string") {
            defineReadOnly(this, "_address", this.provider.formatter.address(addressOrIndex));
            // @ts-expect-error not sure why ethers types as number but also sets to null
            defineReadOnly(this, "_index", null);

        } else if (typeof(addressOrIndex) === "number") {
            defineReadOnly(this, "_index", addressOrIndex);
            // @ts-expect-error not sure why ethers types as number but also sets to undefined
            defineReadOnly(this, "_address", undefined);

        } else {
            logger.throwArgumentError("invalid address or index", "addressOrIndex", addressOrIndex);
        }
    }

    // @ts-expect-error all this actually does is throw sense you cant connect a RpcSigner
    connect: (provider: Provider) => CeloJsonRpcSigner = jsonRpcPrototype.connect.bind(this)

    getAddress: () => Promise<string> = jsonRpcPrototype.getAddress.bind(this)

    signMessage: (message: string | Bytes) =>  Promise<string> = jsonRpcPrototype.signMessage.bind(this)

    _signTypedData: (domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>) => Promise<string> = jsonRpcPrototype._signTypedData.bind(this)

    _legacySignMessage: (message: Bytes | string) =>  Promise<string> = jsonRpcPrototype._legacySignMessage.bind(this)

    // Adds celo fields to the parameter
    signTransaction: (transaction: Deferrable<CeloTransactionRequest>) => Promise<string> = jsonRpcPrototype.signTransaction.bind(this)

    // Adds celo fields to the parameter
    // TODO CeloWallet does not use a special CeloTransactionResponse, just standard one, perhaps that is more correct
    sendTransaction: (transaction: Deferrable<CeloTransactionRequest>) =>  Promise<CeloTransactionResponse> = jsonRpcPrototype.sendTransaction.bind(this)

    // Can either overwrite this, or overwrite the hexlifyTransaction on the provider. (or both if really needed)
    sendUncheckedTransaction: (transaction: Deferrable<CeloTransactionRequest>) => Promise<string> = jsonRpcPrototype.sendUncheckedTransaction.bind(this)

    // from https://github.com/ethers-io/ethers.js/blob/master/packages/abstract-signer/src.ts/index.ts
    // changed to update the allowedTransactionKeys to include feeCurrency
    checkTransaction(transaction: Deferrable<CeloTransactionRequest>): Deferrable<CeloTransactionRequest> {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }

        const tx = shallowCopy(transaction);

        if (tx.from == null) {
            tx.from = this.getAddress();

        } else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then((result) => {
                if (result[0]?.toLowerCase() !== result[1].toLowerCase()) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }

        return tx;
    }

    connectUnchecked(): UncheckedCeloJsonRpcSigner {
        return new UncheckedCeloJsonRpcSigner(_constructorGuard, this.provider, this._address || this._index);
    }

    unlock: (password: string) => Promise<boolean> = jsonRpcPrototype.unlock.bind(this)

}

type NullableCeloTransactionResponse = Record<keyof CeloTransactionResponse, null>


class UncheckedCeloJsonRpcSigner extends CeloJsonRpcSigner {
    // @ts-expect-error this returns null for the properties in ethers so matching even though that doesnt fit the types
    sendTransaction: (transaction: Deferrable<CeloTransactionRequest>) => Promise<NullableCeloTransactionResponse> = async (transaction) => {
        return this.sendUncheckedTransaction(transaction).then(async (hash: string) => {
            // note these are all null in ethers but that wont compile
            return {
                hash: hash,
                nonce: null,
                gasLimit: null,
                gasPrice: null,
                data: null,
                value: null,
                chainId: null,
                confirmations: 0,
                from: null,
                wait: (confirmations?: number) => { return this.provider.waitForTransaction(hash, confirmations); }
            };
        });
    }
}