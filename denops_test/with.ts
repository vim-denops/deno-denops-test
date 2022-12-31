import * as path from "https://deno.land/std@0.170.0/path/mod.ts";
import { Session } from "https://deno.land/x/msgpack_rpc@v3.1.6/mod.ts#^";
import { using } from "https://deno.land/x/disposable@v1.1.0/mod.ts#^";
import type {
  Denops,
  Meta,
} from "https://deno.land/x/denops_core@v3.3.1/mod.ts";
import { run, RunMode } from "./runner.ts";
import { DENOPS_PATH } from "./conf.ts";

const PLUGIN_NAME = "@denops-test";

export type WithDenopsOptions = {
  /** Print Vim messages (echomsg) */
  verbose?: boolean;
  /** Vim commands to be executed before the start of Denops */
  prelude?: string[];
  /** Vim commands to be executed after the start of Denops */
  postlude?: string[];
};

/**
 * Function to be executed by passing a denops instance for testing to the specified function
 *
 * To use this function, the environment variable `DENOPS_TEST_DENOPS_PATH` must be set to the
 * local path to the `denops.vim` repository.
 *
 * The `DENOPS_TEST_VIM_EXECUTABLE` and `DENOPS_TEST_NVIM_EXECUTABLE` environment variables
 * allow you to change the Vim/Neovim execution command (default is `vim` and `nvim` respectively).
 *
 * Note that this is a time-consuming process, especially on Windows, since this function
 * internally spawns Vim/Neovim sub-process, which performs the tests.
 *
 * ```ts
 * Deno.test("Test denops (vim)", async () => {
 *   await withDenops("vim", async (denops) => {
       assertFalse(await denops.call("has", "nvim"));
 *   });
 * });
 *
 * Deno.test("Test denops (nvim)", async () => {
 *   await withDenops("nvim", async (denops) => {
       assert(await denops.call("has", "nvim"));
 *   });
 * });
 * ```
 */
export async function withDenops(
  mode: RunMode,
  main: (denops: Denops) => Promise<void> | void,
  options: WithDenopsOptions = {},
) {
  const scriptPath = new URL("./plugin.ts", import.meta.url);
  const listener = Deno.listen({
    hostname: "127.0.0.1",
    port: 0, // Automatically select free port
  });
  const cmds = [
    ...(options.prelude ?? []),
    "let g:denops#_test = 1",
    `set runtimepath^=${DENOPS_PATH}`,
    `autocmd User DenopsReady call denops#plugin#register('${PLUGIN_NAME}', '${scriptPath}')`,
    "call denops#server#start()",
    ...(options.postlude ?? []),
  ];
  const proc = run(mode, cmds, {
    verbose: options.verbose,
    env: {
      "DENOPS_TEST_ADDRESS": JSON.stringify(listener.addr),
    },
  });
  const conn = await listener.accept();
  try {
    await using(
      new Session(conn, conn, {}, {
        errorCallback(e) {
          if (e.name === "Interrupted") {
            return;
          }
          console.error("Unexpected error occurred", e);
        },
      }),
      async (session) => {
        const meta = await session.call(
          "call",
          "denops#_internal#meta#get",
        ) as Meta;
        await main(await newDenopsImpl(meta, session));
      },
    );
  } finally {
    proc.stdin?.close();
    await killProcess(proc);
    await proc.status();
    proc.close();
    conn.close();
    listener.close();
  }
}

async function newDenopsImpl(
  meta: Meta,
  session: Session,
): Promise<Denops> {
  const { DenopsImpl } = await import(path.join(
    DENOPS_PATH,
    "denops",
    "@denops-private",
    "impl.ts",
  ));
  return new DenopsImpl(PLUGIN_NAME, meta, session);
}

async function killProcess(proc: Deno.Process): Promise<void> {
  if (Deno.build.os === "windows") {
    // Signal API in Deno v1.14.0 on Windows
    // does not work so use `taskkill` for now
    const p = Deno.run({
      cmd: ["taskkill", "/pid", proc.pid.toString(), "/F"],
      stdin: "null",
      stdout: "null",
      stderr: "null",
    });
    await p.status();
    p.close();
  } else {
    proc.kill("SIGTERM");
  }
}
