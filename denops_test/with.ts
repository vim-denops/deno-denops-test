import { fromFileUrl } from "https://deno.land/std@0.210.0/path/mod.ts";
import { deadline } from "https://deno.land/std@0.210.0/async/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  Client,
  Session,
} from "https://deno.land/x/messagepack_rpc@v2.0.3/mod.ts";
import type {
  Denops,
  Meta,
} from "https://deno.land/x/denops_core@v5.0.0/mod.ts";
import { getConfig } from "./conf.ts";
import { run, RunMode } from "./runner.ts";
import { DenopsImpl } from "./denops.ts";
import { errorDeserializer, errorSerializer } from "./error.ts";

const PLUGIN_NAME = "@denops-test";

// Timeout for connecting to Vim/Neovim
// It takes a long time to start Vim/Neovim on Windows so set a long timeout
const CONNECT_TIMEOUT = 30000;

/** Options for `withDenops` function */
export type WithDenopsOptions = {
  /** Plugin name of test target */
  pluginName?: string;
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
  const name = options.pluginName ?? PLUGIN_NAME;
  const plugin = fromFileUrl(new URL("./plugin.ts", import.meta.url));
  const script = fromFileUrl(new URL("./with.vim", import.meta.url));
  const commands = [
    ...(options.prelude ?? []),
    `source ${script.replace(/\s/g, "\\ ")}`,
    `call DenopsTestStart('${conf.denopsPath}', '${name}', '${plugin}')`,
    ...(options.postlude ?? []),
  ];
  const listener = Deno.listen({
    hostname: "127.0.0.1",
    port: 0, // Automatically select free port
  });
  const proc = run(mode, commands, {
    verbose: options.verbose,
    env: {
      "DENOPS_TEST_ADDRESS": JSON.stringify(listener.addr),
    },
  });
  const conn = await deadline(listener.accept(), CONNECT_TIMEOUT);
  try {
    const session = new Session(conn.readable, conn.writable, {
      errorSerializer,
    });
    session.onInvalidMessage = (message) => {
      console.error(`[denops-test] Unexpected message: ${message}`);
    };
    session.onMessageError = (err, message) => {
      console.error(
        `[denops-test] Unexpected error occured for message ${message}: ${err}`,
      );
    };
    session.start();
    const client = new Client(session, {
      errorDeserializer,
    });
    const meta = await client.call(
      "invoke",
      "call",
      ["denops#_internal#meta#get"],
    ) as Meta;
    const denops = new DenopsImpl(name, meta, client);
    session.dispatcher = {
      dispatch: (name, args) => {
        assert(name, is.String);
        assert(args, is.Array);
        return denops.dispatcher[name](...args);
      },
    };
    // Workaround for unexpected "leaking async ops"
    // https://github.com/denoland/deno/issues/15425#issuecomment-1368245954
    await new Promise((resolve) => setTimeout(resolve, 0));
    await main(denops);
    await session.shutdown();
  } finally {
    listener.close();
    proc.kill();
    await Promise.all([
      proc.stdin?.close(),
      proc.output(),
    ]);
  }
}
