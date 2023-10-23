import { test, expect } from "@jest/globals";
import { CeloscanProvider } from "../src/lib/CeloscanProvider";
import { getAccount, getSigner } from "./common";

test("can fetch an account's history", async () => {
  const account = getAccount();
  expect(account).not.toBeUndefined();

  const network = process.env.NETWORK?.toLocaleLowerCase() || "celo";
  const provider = new CeloscanProvider(network);
  const history = await provider.getHistory(account!);

  expect(history.length).toBeGreaterThan(0);
});

test("can fetch an account's balance", async () => {
  const balance = await getSigner().provider?.getBalance(getAccount());
  expect(balance).toBeGreaterThan(0);
});
