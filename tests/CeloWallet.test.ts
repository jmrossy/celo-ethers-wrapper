
import { describe, expect, test, jest } from "@jest/globals";
import { getSigner } from "./common";
import { CeloTransactionRequest } from "../src/lib/transactions";
import { USDC_ADAPTER_ALFAJORES_ADDRESS } from "./consts";


describe('CeloWallet', () => {
    describe('populateFees', () => {
        describe('when no feeCurrency', () => {
            test('populates only maxFeePerGas and maxPriorityFeePerGas', async () => {
              const wallet = getSigner()

              const transactionRequest: CeloTransactionRequest = {
                
              }
                
              const filled = await wallet.populateFees(transactionRequest)

              expect(typeof filled.maxFeePerGas).toEqual('bigint')
              expect(typeof filled.maxPriorityFeePerGas).toEqual('bigint')

              expect(filled.maxFeeInFeeCurrency).toBeUndefined()
              expect(filled.feeCurrency).toBeUndefined()

            })
        })
        describe('when feeCurrency on cel2', () => {
            test('populates maxFeePerGas and maxPriorityFeePerGas and maxFeeInFeeCurrency', async () => {
              const wallet = getSigner()

                
              jest.spyOn(wallet, 'isCel2').mockImplementation(async () => true)

              const transactionRequest: CeloTransactionRequest = {
                feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS,
                gasLimit: 10000000000n
              }
                
              const filled = await wallet.populateFees(transactionRequest)

              expect(typeof filled.maxFeePerGas).toEqual('bigint')
              expect(typeof filled.maxPriorityFeePerGas).toEqual('bigint')

              expect(typeof filled.maxFeeInFeeCurrency).toEqual('bigint')
              expect(filled.feeCurrency).toEqual(USDC_ADAPTER_ALFAJORES_ADDRESS)

            })

        })
        describe('when feeCurrency before cel2', () => {
            test('populates maxFeePerGas and maxPriorityFeePerGas and maxFeeInFeeCurrency', async () => {
                const wallet = getSigner()

                
              jest.spyOn(wallet, 'isCel2').mockImplementation(async () => false)

              const transactionRequest: CeloTransactionRequest = {
                feeCurrency: USDC_ADAPTER_ALFAJORES_ADDRESS
              }
                
              const filled = await wallet.populateFees(transactionRequest)

              expect(typeof filled.maxFeePerGas).toEqual('bigint')
              expect(typeof filled.maxPriorityFeePerGas).toEqual('bigint')

              expect(filled.maxFeeInFeeCurrency).toBeUndefined()
              expect(filled.feeCurrency).toEqual(USDC_ADAPTER_ALFAJORES_ADDRESS)

            })
            
        })
    })
})
