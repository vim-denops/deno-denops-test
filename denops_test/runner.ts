import { is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { getConfig } from "./conf.ts";

/** Runner mode */
export type RunMode = "vim" | "nvim";

/** Runner option */
export type RunOptions =
  & Omit<Deno.CommandOptions, "cmd" | "stdin" | "stdout" | "stderr">
  & {
    verbose?: boolean;
  };

/**
 * Check if the mode is valid `RunMode`
 */
export const isRunMode = is.LiteralOneOf(["vim", "nvim"] as const);

/**
 * Runs the specified commands in the runner
 */
export function run(
  mode: RunMode,
  cmds: string[],
  options: RunOptions = {},
): Deno.ChildProcess {
  const [cmd, args] = buildArgs(mode);
  args.unshift(...cmds.flatMap((c) => ["-c", c]));
  if (options.verbose) {
    args.unshift("--cmd", "redir >> /dev/stdout");
  }
  const command = new Deno.Command(cmd, {
    args,
    env: options.env,
    stdin: "piped",
    stdout: options.verbose ? "inherit" : "null",
    stderr: options.verbose ? "inherit" : "null",
  });
  return command.spawn();
}

function buildArgs(mode: RunMode): [string, string[]] {
  const conf = getConfig();
  switch (mode) {
    case "vim":
      return [
        conf.vimExecutable,
        [
          "-u",
          "NONE", // Disable vimrc, plugins, defaults.vim
          "-i",
          "NONE", // Disable viminfo
          "-n", // Disable swap file
          "-N", // Disable compatible mode
          "-X", // Disable xterm
          "-e", // Start Vim in Ex mode
          "-s", // Silent or batch mode
        ],
      ];
    case "nvim":
      return [
        conf.nvimExecutable,
        ["--clean", "--embed", "--headless", "-n"],
      ];
  }
}
