import { sample } from "https://deno.land/std@0.171.0/collections/sample.ts";
import type { Denops } from "https://deno.land/x/denops_core@v4.0.0/mod.ts";
import type { RunMode } from "./runner.ts";
import { withDenops } from "./with.ts";

/** Test running mode */
export type TestMode = RunMode | "any" | "all";

/** Test definition used in `test` function */
export interface TestDefinition extends Omit<Deno.TestDefinition, "fn"> {
  fn: (denops: Denops, t: Deno.TestContext) => void | Promise<void>;
  /**
   * Test runner mode
   *
   * Specifying "vim" or "nvim" will run the test with the specified runner.
   * If "any" is specified, Vim or Neovim is randomly selected and executed.
   * When "all" is specified, the test is run with both Vim and Neovim.
   */
  mode: TestMode;
  /** Plugin name of test target */
  pluginName?: string;
  /** Print Vim messages (echomsg) */
  verbose?: boolean;
  /** Vim commands to be executed before the start of Denops */
  prelude?: string[];
  /** Vim commands to be executed after the start of Denops */
  postlude?: string[];
}

/**
 * Register a test for denops to be run when `deno test` is used.
 *
 * This function internally uses `Deno.test` and `withDenops` to run
 * tests by passing a `denops` instance to the registered test function.
 *
 * ```ts
 * import { assert, assertFalse } from "https://deno.land/std/testing/asserts.ts";
 * import { test } from "./tester.ts";
 *
 * test("vim", "Test with Vim", async (denops) => {
 *   assertFalse(await denops.call("has", "nvim"));
 * });
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
export function test(
  mode: TestDefinition["mode"],
  name: string,
  fn: TestDefinition["fn"],
): void;
export function test(def: TestDefinition): void;
export function test(
  modeOrDefinition: TestDefinition["mode"] | TestDefinition,
  name?: string,
  fn?: TestDefinition["fn"],
): void {
  if (typeof modeOrDefinition === "string") {
    if (!name) {
      throw new Error(`'name' attribute is required`);
    }
    if (!fn) {
      throw new Error(`'fn' attribute is required`);
    }
    testInternal({
      mode: modeOrDefinition,
      name,
      fn,
    });
  } else {
    testInternal(modeOrDefinition);
  }
}

function testInternal(def: TestDefinition): void {
  const { mode } = def;
  if (mode === "all") {
    testInternal({
      ...def,
      name: `${def.name} (vim)`,
      mode: "vim",
    });
    testInternal({
      ...def,
      name: `${def.name} (nvim)`,
      mode: "nvim",
    });
  } else if (mode === "any") {
    const m = sample(["vim", "nvim"] as const)!;
    testInternal({
      ...def,
      name: `${def.name} (${m})`,
      mode: m,
    });
  } else {
    Deno.test({
      ...def,
      fn: (t) => {
        return withDenops(mode, (denops) => def.fn(denops, t), {
          pluginName: def.pluginName,
          verbose: def.verbose,
          prelude: def.prelude,
          postlude: def.postlude,
        });
      },
    });
  }
}
