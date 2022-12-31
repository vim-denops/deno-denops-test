import { NVIM_EXECUTABLE, VIM_EXECUTABLE } from "./conf.ts";

/** Runner mode */
export type RunMode = "vim" | "nvim";

/** Runner option */
export type RunOptions =
  & Omit<Deno.RunOptions, "cmd" | "stdin" | "stdout" | "stderr">
  & {
    verbose?: boolean;
  };

/**
 * Runs the specified commands in the runner
 */
export function run(
  mode: RunMode,
  cmds: string[],
  options: RunOptions = {},
): Deno.Process {
  const cmd = [...buildArgs(mode), ...cmds.flatMap((c) => ["-c", c])];
  if (options.verbose) {
    cmd.unshift("--cmd", "redir >> /dev/stdout");
  }
  const proc = Deno.run({
    cmd,
    env: options.env,
    stdin: "piped",
    stdout: options.verbose ? "inherit" : "null",
    stderr: options.verbose ? "inherit" : "null",
  });
  return proc;
}

/**
 * Check if the mode is valid `RunMode`
 */
export function isRunMode(mode: string): mode is RunMode {
  switch (mode) {
    case "vim":
    case "nvim":
      return true;
    default:
      return false;
  }
}

function buildArgs(mode: RunMode): string[] {
  switch (mode) {
    case "vim":
      return [
        VIM_EXECUTABLE,
        "-u",
        "NONE",
        "-i",
        "NONE",
        "-n",
        "-N",
        "-X",
        "-e",
        "-s",
      ];
    case "nvim":
      return [
        NVIM_EXECUTABLE,
        "--clean",
        "--embed",
        "--headless",
        "-n",
      ];
  }
}
