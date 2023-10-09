import { test, expect } from "@jest/globals";
import { CeloscanProvider } from "../src/lib/CeloscanProvider";

test("can fetch an account's history", async () => {
  const account = process.env.ACCOUNT;
  expect(account).not.toBeUndefined();

  const network = process.env.NETWORK?.toLocaleLowerCase() || "celo";
  const provider = new CeloscanProvider(network);
  const history = await provider.getHistory(account!);

  expect(history.length).toBeGreaterThan(0);
});
