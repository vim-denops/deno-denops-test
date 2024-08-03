import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
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
      "denops-test",
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

Deno.test("test() throws if 'mode' option is empty", () => {
  assertThrows(
    () => {
      test({
        mode: "" as "vim",
        name: "name",
        fn: () => {},
      });
    },
    Error,
    "'mode' attribute is required",
  );
});

Deno.test("test() throws if 'mode' option is invalid", () => {
  assertThrows(
    () => {
      test({
        mode: "foo" as "vim",
        name: "name",
        fn: () => {},
      });
    },
    Error,
    "'mode' attribute is invalid",
  );
});

Deno.test("test() throws if 'name' option is empty", () => {
  assertThrows(
    () => {
      test({
        mode: "vim",
        name: "",
        fn: () => {},
      });
    },
    Error,
    "'name' attribute is required",
  );
});

Deno.test("test() throws if 'fn' option is empty", () => {
  assertThrows(
    () => {
      test({
        mode: "vim",
        name: "name",
        fn: undefined as unknown as () => void,
      });
    },
    Error,
    "'fn' attribute is required",
  );
});
