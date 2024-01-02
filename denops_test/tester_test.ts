import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import { test } from "./tester.ts";

test({
  mode: "vim",
  name: "test(mode:vim) start vim to test denops features",
  fn: async (denops) => {
    assertFalse(await denops.call("has", "nvim"));
  },
});
test(
  "vim",
  "test(mode:vim) start vim to test denops features",
  async (denops) => {
    assertFalse(await denops.call("has", "nvim"));
  },
);

test({
  mode: "nvim",
  name: "test(mode:nvim) start nvim to test denops features",
  fn: async (denops) => {
    assert(await denops.call("has", "nvim"));
  },
});
test(
  "nvim",
  "test(mode:nvim) start nvim to test denops features",
  async (denops) => {
    assert(await denops.call("has", "nvim"));
  },
);

test({
  mode: "any",
  name: "test(mode:any) start vim or nvim to test denops features",
  fn: async (denops) => {
    // Test if `call` works
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
});
test(
  "any",
  "test(mode:any) start vim or nvim to test denops features",
  async (denops) => {
    // Test if `call` works
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
);

test({
  mode: "all",
  name: "test(mode:all) start both vim and nvim to test denops features",
  fn: async (denops) => {
    // Test if `call` works
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
});
test(
  "all",
  "test(mode:all) start both vim and nvim to test denops features",
  async (denops) => {
    // Test if `call` works
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
);

test({
  mode: "all",
  name: "test(mode:all) start both vim and nvim with plugin name",
  fn: (denops) => {
    assertEquals(
      denops.name,
      "@denops-test",
    );
  },
});

test({
  mode: "all",
  name: "test(mode:all) pass TestContext to the second argument",
  fn: async (denops, t) => {
    await t.step("step1", async () => {
      assertEquals(
        await denops.call("range", 10),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      );
    });
    await t.step("step2", async () => {
      assertEquals(
        await denops.call("range", 10),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      );
    });
  },
});
