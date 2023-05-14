import {
  assert,
  assertFalse,
} from "https://deno.land/std@0.187.0/testing/asserts.ts";
import { withDenops } from "./with.ts";

Deno.test(
  "test(mode:vim) start vim to test denops features",
  () => {
    return withDenops("vim", async (denops) => {
      assertFalse(await denops.call("has", "nvim"));
    });
  },
);

Deno.test(
  "test(mode:nvim) start vim to test denops features",
  () => {
    return withDenops("nvim", async (denops) => {
      assert(await denops.call("has", "nvim"));
    });
  },
);
