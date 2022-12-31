import * as path from "https://deno.land/std@0.170.0/path/mod.ts";
import { orElse } from "./or_else.ts";

function get(name: string): string | undefined {
  return Deno.env.get(`DENOPS_TEST_${name}`);
}

/** Absolute local path of denops added to Vim runtimepath */
export const DENOPS_PATH = path.resolve(
  orElse(get("DENOPS_PATH"), () => {
    throw new Error(
      "Environment variable 'DENOPS_TEST_DENOPS_PATH' is required",
    );
  }),
);

/** Executable name of Vim */
export const VIM_EXECUTABLE = get("VIM_EXECUTABLE") ?? "vim";

/** Executable name of Neovim */
export const NVIM_EXECUTABLE = get("NVIM_EXECUTABLE") ?? "nvim";
