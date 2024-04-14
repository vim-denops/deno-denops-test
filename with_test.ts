import { assert, assertFalse } from "jsr:@std/assert@^0.222.1";
import { withDenops } from "./with.ts";

Deno.test(
  "test(mode:vim) start vim to test denops features",
  async () => {
    let called = false;
    await withDenops("vim", async (denops) => {
      assertFalse(await denops.call("has", "nvim"));
      called = true;
    });
    assert(called, "withDenops main is not called");
  },
);

Deno.test(
  "test(mode:nvim) start vim to test denops features",
  async () => {
    let called = false;
    await withDenops("nvim", async (denops) => {
      assert(await denops.call("has", "nvim"));
      called = true;
    });
    assert(called, "withDenops main is not called");
  },
);
