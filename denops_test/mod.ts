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
 * @module
 */
export type { TestDefinition } from "./tester.ts";
export type { WithDenopsOptions } from "./with.ts";
export { test } from "./tester.ts";
export { withDenops } from "./with.ts";
