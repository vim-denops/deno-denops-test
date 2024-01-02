import * as path from "https://deno.land/std@0.210.0/path/mod.ts";
import {
  Client,
  Session,
} from "https://deno.land/x/messagepack_rpc@v2.0.3/mod.ts";
import type {
  Denops,
  Meta,
} from "https://deno.land/x/denops_core@v5.0.0/mod.ts";
import { run, RunMode } from "./runner.ts";
import { Config, getConfig } from "./conf.ts";

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
  const conf = getConfig();
  const scriptPath = new URL("./plugin.ts", import.meta.url);
  const listener = Deno.listen({
    hostname: "127.0.0.1",
    port: 0, // Automatically select free port
  });
  const pluginName = options.pluginName ?? PLUGIN_NAME;
  const cmds = [
    ...(options.prelude ?? []),
    "let g:denops#_test = 1",
    `set runtimepath^=${conf.denopsPath}`,
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
    const session = new Session(conn.readable, conn.writable);
    session.onInvalidMessage = (message) => {
      console.error("Unexpected message:", message);
    };
    session.onMessageError = (error, message) => {
      console.error(`Unexpected error occured for message ${message}:`, error);
    };
    session.start();
    const client = new Client(session);
    const meta = await client.call(
      "call",
      "denops#_internal#meta#get",
    ) as Meta;
    const denops = await newDenopsImpl(conf, meta, session, client, pluginName);
    // Workaround for unexpected "leaking async ops"
    // https://github.com/denoland/deno/issues/15425#issuecomment-1368245954
    await new Promise((resolve) => setTimeout(resolve, 0));
    await main(denops);
    await session.shutdown();
  } finally {
    proc.stdin?.close();
    proc.kill();
    await proc.status;
    listener.close();
  }
}

async function newDenopsImpl(
  conf: Config,
  meta: Meta,
  session: Session,
  client: Client,
  pluginName: string,
): Promise<Denops> {
  const url = path.toFileUrl(path.join(
    conf.denopsPath,
    "denops",
    "@denops-private",
    "impl.ts",
  ));
  const { DenopsImpl } = await import(url.href);
  return new DenopsImpl(pluginName, meta, {
    get dispatcher() {
      return session.dispatcher;
    },
    set dispatcher(dispatcher) {
      session.dispatcher = dispatcher;
    },
    call(method: string, ...params: unknown[]): Promise<unknown> {
      return client.call(method, ...params);
    },
    notify(method: string, ...params: unknown[]): Promise<void> {
      client.notify(method, ...params);
      return Promise.resolve();
    },
  });
}
