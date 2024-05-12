import { mergeReadableStreams } from "https://deno.land/std@0.210.0/streams/merge_readable_streams.ts";
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
 * Represents results of the runner.
 */
export interface RunResult extends AsyncDisposable {
  /**
   * Aborts the process.
   */
  close(): void;
  /**
   * Wait the process closed and returns status.
   */
  waitClosed(): Promise<WaitClosedResult>;
}

type WaitClosedResult = {
  status: Deno.CommandStatus;
  output?: string;
};

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
): RunResult {
  const conf = getConfig();
  const { verbose = conf.verbose } = options;
  const [cmd, args] = buildArgs(conf, mode);
  args.push(...cmds.flatMap((c) => ["-c", c]));
  const aborter = new AbortController();
  const { signal } = aborter;
  const command = new Deno.Command(cmd, {
    args,
    env: options.env,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    signal,
  });
  const proc = command.spawn();
  let outputStream = mergeReadableStreams(
    proc.stdout.pipeThrough(new TextDecoderStream(), { signal }),
    proc.stderr.pipeThrough(new TextDecoderStream(), { signal }),
  );
  if (verbose) {
    const [consoleStream] = [, outputStream] = outputStream.tee();
    consoleStream.pipeTo(
      new WritableStream({ write: (data) => console.error(data) }),
    ).catch(() => {});
  }
  return {
    close() {
      aborter.abort("close");
    },
    async waitClosed() {
      const [status, output] = await Promise.all([
        proc.status,
        Array.fromAsync(outputStream)
          .then((list) => list.join(""))
          .catch(() => undefined),
      ]);
      await proc.stdin.abort();
      return { status, output };
    },
    async [Symbol.asyncDispose]() {
      this.close();
      await this.waitClosed();
    },
  };
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
          "-V1", // Verbose level 1 (Echo messages to stderr)
          "-c",
          "visual", // Go to Normal mode
        ],
      ];
    case "nvim":
      return [
        conf.nvimExecutable,
        [
          "--clean",
          "--headless",
          "-n", // Disable swap file
          "-V1", // Verbose level 1 (Echo messages to stderr)
        ],
      ];
    default:
      unreachable(mode);
  }
}
