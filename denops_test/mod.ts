/**
 * [Deno][deno] module for testing [denops.vim][denops.vim]. This module is assumed
 * to be used in unittests of denops plugin.
 *
 * [deno]: https://deno.land/
 * [denops.vim]: https://github.com/vim-denops/denops.vim
 *
 * ```typescript
 * import { assert, assertFalse } from "https://deno.land/std/testing/asserts.ts";
 * import { test } from "./mod.ts";
 *
 * test(
 *   "vim",
 *   "test(mode:vim) start vim to test denops features",
 *   async (denops) => {
 *     assertFalse(await denops.call("has", "nvim"));
 *   },
 * );
 *
 * test({
 *   mode: "nvim",
 *   name: "test(mode:nvim) start nvim to test denops features",
 *   fn: async (denops) => {
 *     assert(await denops.call("has", "nvim"));
 *   },
 * });
 * ```
 *
 * Use `DenopsStub` class to create a stub instance of `Denops` interface
 * if no real Vim/Neovim behavior is required for the tests.
 *
 * ```typescript
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * import { DenopsStub } from "./mod.ts";
 *
 * Deno.test("denops.call", async () => {
 *   const denops = new DenopsStub({
 *     call: (fn, ...args) => {
 *       return Promise.resolve([fn, ...args]);
 *     },
 *   });
 *   assertEquals(await denops.call("foo", "bar"), ["foo", "bar"]);
 * });
 * ```
 *
 * @module
 */
export type { DenopsStubber } from "./stub.ts";
export type { TestDefinition } from "./tester.ts";
export type { WithDenopsOptions } from "./with.ts";
export { DenopsStub } from "./stub.ts";
export { test } from "./tester.ts";
export { withDenops } from "./with.ts";
