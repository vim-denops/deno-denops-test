/**
 * A [Deno] module designed for testing [denops.vim]. This module is intended to be
 * used in the unit tests of denops plugins.
 *
 * [deno]: https://deno.land/
 * [denops.vim]: https://github.com/vim-denops/denops.vim
 *
 * > [!NOTE]
 * >
 * > To use the `test` function, an environment variable `DENOPS_TEST_DENOPS_PATH`
 * > is required. Clone the [denops.vim] repository and set the path to this
 * > environment variable.
 * >
 * > Additionally, the following environment variables are available to configure
 * > the behavior of the `test` function:
 * >
 * > - `DENOPS_TEST_VIM_EXECUTABLE`: Path to the Vim executable (default: "vim")
 * > - `DENOPS_TEST_NVIM_EXECUTABLE`: Path to the Neovim executable (default:
 *   > "nvim")
 * > - `DENOPS_TEST_VERBOSE`: `1` or `true` to print Vim messages (echomsg)
 *
 * If you want to test denops plugins with a real Vim and/or Neovim process, use
 * the `test` function to define a test case, as shown below:
 *
 * ```typescript
 * import {
 *   assert,
 *   assertEquals,
 *   assertFalse,
 * } from "jsr:@std/assert";
 * import { test } from "jsr:@denops/test";
 *
 * test(
 *   "vim",
 *   "Start Vim to test denops features",
 *   async (denops) => {
 *     assertFalse(await denops.call("has", "nvim"));
 *   },
 * );
 *
 * test({
 *   mode: "nvim",
 *   name: "Start Neovim to test denops features",
 *   fn: async (denops) => {
 *     assert(await denops.call("has", "nvim"));
 *   },
 * });
 *
 * test({
 *   mode: "all",
 *   name: "Start Vim and Neovim to test denops features",
 *   fn: async (denops) => {
 *     assertEquals(await denops.call("abs", -4), 4);
 *   },
 * });
 *
 * test({
 *   mode: "any",
 *   name: "Start Vim or Neovim to test denops features",
 *   fn: async (denops) => {
 *     assertEquals(await denops.call("abs", -4), 4);
 *   },
 * });
 * ```
 *
 * If you want to test denops plugins without a real Vim and/or Neovim process, use
 * the `DenopsStub` class to create a stub instance of the `Denops` interface, as
 * shown below:
 *
 * ```typescript
 * import { assertEquals } from "jsr:@std/assert";
 * import { DenopsStub } from "jsr:@denops/test";
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
