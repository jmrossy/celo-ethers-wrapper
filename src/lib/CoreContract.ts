import {Contract} from "ethers"
import CeloWallet from "./CeloWallet"
import { CELO_REGISTRY_ADDRESS } from "../consts"

const MINIMAL_ORACLE_INTERFACE =  [
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "medianRate",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]

 
const MINIMAL_REGISTRY_ABI =  [{
    "constant": true,
    "inputs": [
      {
        "internalType": "string",
        "name": "identifier",
        "type": "string"
      }
    ],
    "name": "getAddressForString",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }]


  
  export async function getConversionRateFromCeloToToken(tokenAddress: string, {wallet}: {wallet: CeloWallet}): Promise<[bigint, bigint]> {
    const registry = new Contract(CELO_REGISTRY_ADDRESS, MINIMAL_REGISTRY_ABI , wallet)

    const oracleAddress = await registry.getAddressForString('SortedOracles')

    const oracle = new Contract(oracleAddress, MINIMAL_ORACLE_INTERFACE, wallet)

    const [numerator, denominator]: bigint[] = await oracle.medianRate(tokenAddress)
    // TODO see what result actually is. it might be an object or tuple. 
    // and rate might need to be transformed into a decimal
    return [numerator, denominator]
  }