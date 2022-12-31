import { sample } from "https://deno.land/std@0.170.0/collections/sample.ts";
import type { Denops } from "https://deno.land/x/denops_core@v3.3.1/mod.ts";
import type { RunMode } from "./runner.ts";
import { withDenops } from "./with.ts";

export type TestMode = RunMode | "any" | "all";

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
  fn: (denops: Denops) => void | Promise<void>;
  /**
   * Test runner mode
   *
   * Specifying "vim" or "nvim" will run the test with the specified runner.
   * If "any" is specified, Vim or Neovim is randomly selected and executed.
   * When "all" is specified, the test is run with both Vim and Neovim.
   */
  mode: TestMode;
  /** Print Vim messages (echomsg) */
  verbose?: boolean;
  /** Vim commands to be executed before the start of Denops */
  prelude?: string[];
  /** Vim commands to be executed after the start of Denops */
  postlude?: string[];
};

/**
 * Register a test for denops to be run when `deno test` is used.
 *
 * This function internally uses `Deno.test` and `withDenops` to run
 * tests by passing a `denops` instance to the registered test function.
 *
 * ```ts
 * test("vim", "Test with Vim", async (denops) => {
 *   assertFalse(await denops.call("has", "nvim"));
 * });
 *
 * test({
 *   mode: "nvim",
 *   name: "Test with Neovim",
 *   fn: async (denops) => {
 *     assert(await denops.call("has", "nvim"));
 *   }),
 * });
 * ```
 */
export function test(
  mode: TestDefinition["mode"],
  name: string,
  fn: TestDefinition["fn"],
): void;
export function test(t: TestDefinition): void;
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

function testInternal(t: TestDefinition): void {
  const mode = t.mode;
  if (mode === "all") {
    testInternal({
      ...t,
      name: `${t.name} (vim)`,
      mode: "vim",
    });
    testInternal({
      ...t,
      name: `${t.name} (nvim)`,
      mode: "nvim",
    });
  } else if (mode === "any") {
    const m = sample(["vim", "nvim"] as const)!;
    testInternal({
      ...t,
      name: `${t.name} (${m})`,
      mode: m,
    });
  } else {
    Deno.test({
      ...t,
      fn: () => {
        return withDenops(mode, t.fn, {
          verbose: t.verbose,
          prelude: t.prelude,
          postlude: t.postlude,
        });
      },
    });
  }
}
