
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
            throw new Error("do not call the CeloJsonRpcSigner constructor directly; use CeloProvider.getSigner");
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
    // TODO CeloWallet does not use a special TransactionRequest, just standard one, perhaps that is more correct
    sendTransaction: (transaction: Deferrable<CeloTransactionRequest>) =>  Promise<CeloTransactionResponse> = jsonRpcPrototype.sendTransaction.bind(this)

    // Can either overwrite this, or overwrite the hexlifyTransaction on the provider. (or both if really needed)
    // sendUncheckedTransaction: (transaction: Deferrable<CeloTransactionRequest>) => Promise<string> = jsonRpcPrototype.sendUncheckedTransaction.bind(this)

    sendUncheckedTransaction(transaction: Deferrable<CeloTransactionRequest>): Promise<string> {
        transaction = shallowCopy(transaction);

        const fromAddress = this.getAddress().then((address) => {
            if (address) { address = address.toLowerCase(); }
            return address;
        });

        // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
        // wishes to use this, it is easy to specify explicitly, otherwise
        // we look it up for them.
        if (transaction.gasLimit == null) {
            const estimate = shallowCopy(transaction);
            estimate.from = fromAddress;
            transaction.gasLimit = this.provider.estimateGas(estimate);
        }

        if (transaction.to != null) {
            // @ts-expect-error the way null is handled in ethers is odd
            transaction.to = Promise.resolve(transaction.to).then(async (to) => {
                if (to == null) { return null; }
                const address = await this.provider.resolveName(to);
                if (address == null) {
                    logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                }
                return address;
            });
        }

        return resolveProperties({
            tx: resolveProperties(transaction),
            sender: fromAddress
        }).then(({ tx, sender }) => {

            if (tx.from != null) {
                if (tx.from.toLowerCase() !== sender) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
            } else {
                tx.from = sender;
            }

            const hexTx = CeloProvider.hexlifyTransaction(tx, { from: true, feeCurrency: true });

            return this.provider.send("eth_sendTransaction", [ hexTx ]).then((hash) => {
                return hash;
            }, (error) => {
                return checkError("sendTransaction", error, hexTx);
            });
        });
    }


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
                // hash: hash,
                // nonce: 0,
                // feeCurrency: await transaction.feeCurrency,
                // gasLimit: await Promise.resolve(transaction.gasLimit).then(gas  => BigNumber.from(gas)),
                // gasPrice: await Promise.resolve(transaction.gasPrice).then(gas  => BigNumber.from(gas)),
                // data: await Promise.resolve(transaction.data).then(data => data?.toString()) || '',
                // value:  await Promise.resolve(transaction.value).then(val  => BigNumber.from(val)),
                // chainId: 0,
                // confirmations: 0,
                // from: await Promise.resolve(transaction.from) as string,
                // wait: (confirmations?: number) => { return this.provider.waitForTransaction(hash, confirmations) }
            };
        });
    }
}


// Functions copied directly from @ethersproject/providers/src.ts/json-rpc-provider.ts
// they are not exported so needed to be copied
function checkError(method: string, error: any, params: any): any {

    const transaction = params.transaction || params.signedTransaction;

    // Undo the "convenience" some nodes are attempting to prevent backwards
    // incompatibility; maybe for v6 consider forwarding reverts as errors
    if (method === "call") {
        const result = spelunk(error, true);
        if (result) { return result.data; }

        // Nothing descriptive..
        logger.throwError("missing revert data in call exception; Transaction reverted without a reason string", Logger.errors.CALL_EXCEPTION, {
            data: "0x", transaction, error
        });
    }

    if (method === "estimateGas") {
        // Try to find something, with a preference on SERVER_ERROR body
        let result = spelunk(error.body, false);
        if (result == null) { result = spelunk(error, false); }

        // Found "reverted", this is a CALL_EXCEPTION
        if (result) {
            logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
                reason: result.message, method, transaction, error
            });
        }
    }

    // @TODO: Should we spelunk for message too?

    let message = error.message;
    if (error.code === Logger.errors.SERVER_ERROR && error.error && typeof(error.error.message) === "string") {
        message = error.error.message;
    } else if (typeof(error.body) === "string") {
        message = error.body;
    } else if (typeof(error.responseText) === "string") {
        message = error.responseText;
    }
    message = (message || "").toLowerCase();

    // "insufficient funds for gas * price + value + cost(data)"
    if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
        logger.throwError("insufficient funds for intrinsic transaction cost", Logger.errors.INSUFFICIENT_FUNDS, {
            error, method, transaction
        });
    }

    // "nonce too low"
    if (message.match(/nonce (is )?too low/i)) {
        logger.throwError("nonce has already been used", Logger.errors.NONCE_EXPIRED, {
            error, method, transaction
        });
    }

    // "replacement transaction underpriced"
    if (message.match(/replacement transaction underpriced|transaction gas price.*too low/i)) {
        logger.throwError("replacement fee too low", Logger.errors.REPLACEMENT_UNDERPRICED, {
            error, method, transaction
        });
    }

    // "replacement transaction underpriced"
    if (message.match(/only replay-protected/i)) {
        logger.throwError("legacy pre-eip-155 transactions not supported", Logger.errors.UNSUPPORTED_OPERATION, {
            error, method, transaction
        });
    }

    if (errorGas.indexOf(method) >= 0 && message.match(/gas required exceeds allowance|always failing transaction|execution reverted/)) {
        logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
            error, method, transaction
        });
    }

    throw error;
}


const errorGas = [ "call", "estimateGas" ];

function spelunk(value: any, requireData: boolean): null | { message: string, data: null | string } {
    if (value == null) { return null; }

    // These *are* the droids we're looking for.
    if (typeof(value.message) === "string" && value.message.match("reverted")) {
        const data = isHexString(value.data) ? value.data: null;
        if (!requireData || data) {
            return { message: value.message, data };
        }
    }

    // Spelunk further...
    if (typeof(value) === "object") {
        for (const key in value) {
            const result = spelunk(value[key], requireData);
            if (result) { return result; }
        }
        return null;
    }

    // Might be a JSON string we can further descend...
    if (typeof(value) === "string") {
        try {
            return spelunk(JSON.parse(value), requireData);
        } catch (error) { }
    }

    return null;
}