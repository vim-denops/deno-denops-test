import { sample } from "jsr:@std/collections@1.0.5/sample";
import type { Denops } from "jsr:@denops/core@7.0.0";
import type { RunMode } from "./runner.ts";
import { withDenops } from "./with.ts";

/**
 * Represents the running mode for tests.
 */
export type TestMode = RunMode | "any" | "all";

/** Represents a test definition used in the `test` function. */
export interface TestDefinition extends Omit<Deno.TestDefinition, "fn"> {
  fn: (denops: Denops, t: Deno.TestContext) => void | Promise<void>;
  /**
   * Test runner mode.
   *
   * - Specifying "vim" or "nvim" will run the test with the specified runner.
   * - If "any" is specified, Vim or Neovim is randomly selected and executed.
   * - When "all" is specified, the test is run with both Vim and Neovim.
   */
  mode: TestMode;
  /** The plugin name of the test target. */
  pluginName?: string;
  /** Prints Vim messages (echomsg). */
  verbose?: boolean;
  /** Vim commands to be executed before the start of Denops. */
  prelude?: string[];
  /** Vim commands to be executed after the start of Denops. */
  postlude?: string[];
}

/**
 * Registers a test for Denops to be run when `deno test` is used.
 *
 * To use this function, the environment variable `DENOPS_TEST_DENOPS_PATH` must be set to the
 * local path to the `denops.vim` repository.
 *
 * The `DENOPS_TEST_VIM_EXECUTABLE` and `DENOPS_TEST_NVIM_EXECUTABLE` environment variables
 * allow you to change the Vim/Neovim execution command (default is `vim` and `nvim` respectively).
 *
 * Note that this is a time-consuming process, especially on Windows, since this function
 * internally spawns Vim/Neovim sub-process, which performs the tests.
 *
 * This function internally uses `Deno.test` and `withDenops` to run
 * tests by passing a `denops` instance to the registered test function.
 *
 * ```ts
 * import { assert, assertFalse } from "jsr:@std/assert";
 * import { test } from "jsr:@denops/test";
 *
 * test("vim", "Test with Vim", async (denops) => {
 *   assertFalse(await denops.call("has", "nvim"));
 * });
 * ```
 */
export function test(
  mode: TestDefinition["mode"],
  name: string,
  fn: TestDefinition["fn"],
): void;
/**
 * Registers a test for Denops to be run when `deno test` is used.
 *
 * To use this function, the environment variable `DENOPS_TEST_DENOPS_PATH` must be set to the
 * local path to the `denops.vim` repository.
 *
 * The `DENOPS_TEST_VIM_EXECUTABLE` and `DENOPS_TEST_NVIM_EXECUTABLE` environment variables
 * allow you to change the Vim/Neovim execution command (default is `vim` and `nvim` respectively).
 *
 * Note that this is a time-consuming process, especially on Windows, since this function
 * internally spawns Vim/Neovim sub-process, which performs the tests.
 *
 * This function internally uses `Deno.test` and `withDenops` to run
 * tests by passing a `denops` instance to the registered test function.
 *
 * ```ts
 * import { assert, assertFalse } from "jsr:@std/assert";
 * import { test } from "jsr:@denops/test";
 *
 * test({
 *   mode: "nvim",
 *   name: "Test with Neovim",
 *   fn: async (denops) => {
 *     assert(await denops.call("has", "nvim"));
 *   },
 * });
 * ```
 */
export function test(def: TestDefinition): void;
export function test(
  modeOrDefinition: TestDefinition["mode"] | TestDefinition,
  name?: string,
  fn?: TestDefinition["fn"],
): void {
  if (typeof modeOrDefinition === "string") {
    testInternal({
      mode: modeOrDefinition,
      name,
      fn,
    });
  } else {
    testInternal(modeOrDefinition);
  }
}

function testInternal(def: Partial<TestDefinition>): void {
  const {
    mode,
    name,
    fn,
    pluginName,
    verbose,
    prelude,
    postlude,
    ...denoTestDef
  } = def;
  if (!mode) {
    throw new Error("'mode' attribute is required");
  }
  if (!name) {
    throw new Error("'name' attribute is required");
  }
  if (!fn) {
    throw new Error("'fn' attribute is required");
  }
  if (mode === "all") {
    testInternal({
      ...def,
      name: `${name} (vim)`,
      mode: "vim",
    });
    testInternal({
      ...def,
      name: `${name} (nvim)`,
      mode: "nvim",
    });
  } else if (mode === "any") {
    const m = sample(["vim", "nvim"] as const)!;
    testInternal({
      ...def,
      name: `${name} (${m})`,
      mode: m,
    });
  } else {
    if (!["vim", "nvim"].includes(mode)) {
      throw new Error(`'mode' attribute is invalid: ${mode}`);
    }
    Deno.test({
      ...denoTestDef,
      name,
      fn: (t) => {
        return withDenops(mode, (denops) => fn.call(def, denops, t), {
          pluginName,
          verbose,
          prelude,
          postlude,
        });
      },
    });
  }
}
