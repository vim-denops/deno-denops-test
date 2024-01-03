import { resolve } from "https://deno.land/std@0.210.0/path/mod.ts";

let conf: Config | undefined;

export type Config = {
  denopsPath: string;
  vimExecutable: string;
  nvimExecutable: string;
};

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
  conf = {
    denopsPath: resolve(denopsPath),
    vimExecutable: Deno.env.get("DENOPS_TEST_VIM_EXECUTABLE") ?? "vim",
    nvimExecutable: Deno.env.get("DENOPS_TEST_NVIM_EXECUTABLE") ?? "nvim",
  };
  return conf;
}
