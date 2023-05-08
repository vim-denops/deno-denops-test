import * as path from "https://deno.land/std@0.186.0/path/mod.ts";
import { Session } from "https://deno.land/x/msgpack_rpc@v3.1.6/mod.ts#^";
import { using } from "https://deno.land/x/disposable@v1.1.1/mod.ts#^";
import type {
  Denops,
  Meta,
} from "https://deno.land/x/denops_core@v4.0.0/mod.ts";
import { run, RunMode } from "./runner.ts";
import { DENOPS_PATH } from "./conf.ts";

const PLUGIN_NAME = "@denops-test";

/** Options for `withDenops` function */
export interface WithDenopsOptions {
  /** Plugin name of test target */
  pluginName?: string;
  /** Print Vim messages (echomsg) */
  verbose?: boolean;
  /** Vim commands to be executed before the start of Denops */
  prelude?: string[];
  /** Vim commands to be executed after the start of Denops */
  postlude?: string[];
}

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
 * import { assert, assertFalse } from "https://deno.land/std/testing/asserts.ts";
 * import { withDenops } from "./with.ts";
 *
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
  const pluginName = options.pluginName ?? PLUGIN_NAME;
  const cmds = [
    ...(options.prelude ?? []),
    "let g:denops#_test = 1",
    `set runtimepath^=${DENOPS_PATH}`,
    `autocmd User DenopsReady call denops#plugin#register('${pluginName}', '${scriptPath}')`,
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
        const denops = await newDenopsImpl(meta, session, pluginName);
        // Workaround for unexpected "leaking async ops"
        // https://github.com/denoland/deno/issues/15425#issuecomment-1368245954
        await new Promise((resolve) => setTimeout(resolve, 0));
        await main(denops);
      },
    );
  } finally {
    proc.stdin.close();
    proc.kill();
    await proc.status;
    conn.close();
    listener.close();
  }
}

async function newDenopsImpl(
  meta: Meta,
  session: Session,
  pluginName: string,
): Promise<Denops> {
  const url = path.toFileUrl(path.join(
    DENOPS_PATH,
    "denops",
    "@denops-private",
    "impl.ts",
  ));
  const { DenopsImpl } = await import(url.href);
  return new DenopsImpl(pluginName, meta, session);
}
