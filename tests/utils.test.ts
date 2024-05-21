

import { describe, it, expect } from "@jest/globals";
import { convertFromCeloToToken } from "../src/lib/transaction/utils";


describe("convertFromCeloToToken", () => {
    describe('when given an amount in CELO', () => {
        it('gives an the equivelent amount when token is more valued than celo', () => {
            const converted = convertFromCeloToToken({
                amountInCelo: 1000n, 
                equivalentCELO: 10n, 
                equivalentTOKEN: 5n
            })
            expect(converted.toString()).toEqual(2000n.toString())
        })
         
        it('gives an the equivelent amount when token is less valued than celo', () => {
            // These are actual values from the chain
            const trueNumerator = 908349240852296382100000n
            const trueDenominator = 1000000000000000000000000n
            
            const converted = convertFromCeloToToken({
                amountInCelo: 1000n, 
                equivalentCELO: trueDenominator, 
                equivalentTOKEN: trueNumerator
            })
            expect(converted.toString()).toEqual(1100n.toString())
        })
    })
})