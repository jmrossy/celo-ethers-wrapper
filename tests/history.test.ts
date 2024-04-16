import { expect, test } from "@jest/globals";
import { CeloscanProvider } from "../src/lib/CeloscanProvider";
import { getAccount, getSigner } from "./common";

/**
 * TODO(Arthur): Ensure this test runs sequentially after a transfer or transaction has been 
 * triggered in a test suite run. 
 * Otherwise a brand new wallet with no transaction history will fail this test.
 * 
 * This test currently fails with my newly initialised and fauceted account.
 * 
 * Might not be necessary to change order of execution, but re-evaluate what this
 * test asserts. Seems Celoscan specific.
 */
test("can fetch an account's history", async () => {
  const account = getAccount();
  expect(account).not.toBeUndefined();

  const network = process.env.NETWORK?.toLocaleLowerCase() || "celo";
  console.log(`Getting history for account ${account} on network ${network}`);
  const provider = new CeloscanProvider(network);
  const history = await provider.getHistory(account!);

  expect(history.length).toBeGreaterThan(0);
});

test("can fetch an account's balance", async () => {
  const balance = await getSigner().provider?.getBalance(getAccount());
  expect(balance).toBeGreaterThan(0);
});
