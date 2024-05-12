import { resolve } from "https://deno.land/std@0.210.0/path/mod.ts";

let conf: Config | undefined;

/**
 * Configuration settings for denops testing.
 */
export interface Config {
  /**
   * Local path to the denops.vim repository.
   * It refers to the environment variable 'DENOPS_TEST_DENOPS_PATH'.
   */
  denopsPath: string;

  /**
   * Path to the Vim executable (default: "vim").
   * It refers to the environment variable 'DENOPS_TEST_VIM_EXECUTABLE'.
   */
  vimExecutable: string;

  /**
   * Path to the Neovim executable (default: "nvim").
   * It refers to the environment variable 'DENOPS_TEST_NVIM_EXECUTABLE'.
   */
  nvimExecutable: string;

  /**
   * Print Vim messages (echomsg).
   * It refers to the environment variable 'DENOPS_TEST_VERBOSE'.
   */
  verbose: boolean;

  /**
   * Timeout for connecting to Vim/Neovim.
   * It refers to the environment variable 'DENOPS_TEST_CONNECT_TIMEOUT'.
   */
  connectTimeout?: number;
}

/**
 * Retrieves the configuration settings for denops testing.
 * If the configuration has already been retrieved, it returns the cached
 * configuration. Otherwise, it reads the environment variables and constructs
 * the configuration object.
 *
 * It reads environment variables below:
 *
 * - `DENOPS_TEST_DENOPS_PATH`: Local path to the denops.vim repository (required)
 * - `DENOPS_TEST_VIM_EXECUTABLE`: Path to the Vim executable (default: "vim")
 * - `DENOPS_TEST_NVIM_EXECUTABLE`: Path to the Neovim executable (default: "nvim")
 * - `DENOPS_TEST_VERBOSE`: `1` or `true` to print Vim messages (echomsg)
 * - `DENOPS_TEST_CONNECT_TIMEOUT`: Timeout [ms] for connecting to Vim/Neovim (default: 30000)
 *
 * It throws an error if the environment variable 'DENOPS_TEST_DENOPS_PATH' is
 * not set.
 */
export function getConfig(): Config {
  if (conf) {
    return conf;
  }
  const denopsPath = Deno.env.get("DENOPS_TEST_DENOPS_PATH");
  if (!denopsPath) {
    throw new Error(
      "Environment variable 'DENOPS_TEST_DENOPS_PATH' is required",
    );
  }
  const verbose = Deno.env.get("DENOPS_TEST_VERBOSE");
  const connectTimeout = Number.parseInt(
    Deno.env.get("DENOPS_TEST_CONNECT_TIMEOUT") ?? "",
  );
  conf = {
    denopsPath: resolve(denopsPath),
    vimExecutable: Deno.env.get("DENOPS_TEST_VIM_EXECUTABLE") ?? "vim",
    nvimExecutable: Deno.env.get("DENOPS_TEST_NVIM_EXECUTABLE") ?? "nvim",
    verbose: verbose === "1" || verbose === "true",
    connectTimeout: Number.isNaN(connectTimeout) || connectTimeout <= 0
      ? undefined
      : connectTimeout,
  };
  return conf;
}
