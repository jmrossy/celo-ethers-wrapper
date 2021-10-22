import { CeloProvider, CeloWallet, parseCeloTransaction } from "..";
import { randomBytes } from "crypto";

it('parse/serializeTransaction', async () => {
  const pKey = randomBytes(32)
  const provider = new CeloProvider('https://forno.celo.org')
  const wallet = new CeloWallet(pKey, provider)
  const from = await wallet.getAddress()
  const tx = {
    to: "0xf93525b95856fe1f1ccd37420ba4ef5dd060d408",
    gasLimit: 976258,
    gasPrice: 101100000,
    data: "0xe5546f37000000000000000000000000000000000000000000000008ba52e6fc45e4000000000000000000000000000064defa3544c695db8c535d289d843a189aa26b98000000000000000000000000471ece3750da237f93b8e339c536989b8978a43800000000000000000000000062d5b84be28a183abb507e125b384122d2c25fae000000000000000000000000e3d8bd6aed4f159bc8000a9cd47cffdb95f96121000000000000000000000000e3d8bd6aed4f159bc8000a9cd47cffdb95f961210000000000000000000000005d2238753f3ca5e649f9250c303d5c196a069f24000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005025a0e69dba8bb14bb21f0f15fc15dc67360af4000000000000000000000000000000000000000000000000000000000000000300000000000000000000000064defa3544c695db8c535d289d843a189aa26b9800000000000000000000000000be915b9dcf56a3cbe739d9b9c202ca692409ec000000000000000000000000471ece3750da237f93b8e339c536989b8978a438",
    nonce: 249055,
  }

  const signedTx = await wallet.signTransaction(tx)
  const parsedTx = parseCeloTransaction(signedTx)
  expect(parsedTx.from).toEqual(from)
});