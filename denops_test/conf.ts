import * as path from "https://deno.land/std@0.190.0/path/mod.ts";
import { orElse } from "./or_else.ts";

let conf: Config | undefined;

export type Config = {
  denopsPath: string;
  vimExecutable: string;
  nvimExecutable: string;
};

export function getConfig(): Config {
  if (!conf) {
    conf = {
      denopsPath: path.resolve(orElse(get("DENOPS_PATH"), () => {
        throw new Error(
          "Environment variable 'DENOPS_TEST_DENOPS_PATH' is required",
        );
      })),
      vimExecutable: get("VIM_EXECUTABLE") ?? "vim",
      nvimExecutable: get("NVIM_EXECUTABLE") ?? "nvim",
    };
  }
  return conf;
}

function get(name: string): string | undefined {
  return Deno.env.get(`DENOPS_TEST_${name}`);
}
