import { is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { unreachable } from "https://deno.land/x/errorutil@v0.1.1/mod.ts";
import { Config, getConfig } from "./conf.ts";

/**
 * Represents the mode in which the runner operates.
 */
export type RunMode = "vim" | "nvim";

/**
 * Represents options for the runner.
 */
export interface RunOptions
  extends Omit<Deno.CommandOptions, "cmd" | "stdin" | "stdout" | "stderr"> {
  /**
   * A flag indicating whether to enable verbose output.
   */
  verbose?: boolean;
}

/**
 * Checks if the provided mode is a valid `RunMode`.
 */
export const isRunMode = is.LiteralOneOf(["vim", "nvim"] as const);

/**
 * Runs the specified commands in the runner.
 *
 * @param mode - The mode in which the runner operates (`vim` or `nvim`).
 * @param cmds - An array of commands to run.
 * @param options - Options for configuring the runner.
 */
export function run(
  mode: RunMode,
  cmds: string[],
  options: RunOptions = {},
): Deno.ChildProcess {
  const conf = getConfig();
  const verbose = options.verbose ?? conf.verbose;
  const [cmd, args] = buildArgs(conf, mode);
  args.push(...cmds.flatMap((c) => ["-c", c]));
  if (verbose) {
    args.unshift("--cmd", "redir >> /dev/stdout");
  }
  const command = new Deno.Command(cmd, {
    args,
    env: options.env,
    stdin: "piped",
    stdout: verbose ? "inherit" : "null",
    stderr: verbose ? "inherit" : "null",
  });
  return command.spawn();
}

function buildArgs(conf: Config, mode: RunMode): [string, string[]] {
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
          "-s", // Silent or batch mode ("-e" is required before)
          "-c",
          "visual", // Go to Normal mode
        ],
      ];
    case "nvim":
      return [
        conf.nvimExecutable,
        ["--clean", "--embed", "--headless", "-n"],
      ];
    default:
      unreachable(mode);
  }
}
