import type {
  Context,
  Denops,
  Dispatcher,
  Meta,
} from "https://deno.land/x/denops_core@v6.0.2/mod.ts";
import { Client } from "https://deno.land/x/messagepack_rpc@v2.0.3/mod.ts";

export class DenopsImpl implements Denops {
  readonly name: string;
  readonly meta: Meta;
  readonly context: Record<string | number | symbol, unknown> = {};

  dispatcher: Dispatcher = {};

  #client: Client;

  constructor(
    name: string,
    meta: Meta,
    client: Client,
  ) {
    this.name = name;
    this.meta = meta;
    this.#client = client;
  }

  redraw(force?: boolean): Promise<void> {
    return this.#client.call("invoke", "redraw", [force]) as Promise<void>;
  }

  async call(fn: string, ...args: unknown[]): Promise<unknown> {
    try {
      return await this.#client.call("invoke", "call", [fn, ...args]);
    } catch (err) {
      // Denops v5 or earlier may throws an error as string in Neovim
      // so convert the error into an Error instance
      if (typeof err === "string") {
        throw new Error(err);
      }
      throw err;
    }
  }

  batch(
    ...calls: [string, ...unknown[]][]
  ): Promise<unknown[]> {
    return this.#client.call("invoke", "batch", calls) as Promise<unknown[]>;
  }

  cmd(cmd: string, ctx: Context = {}): Promise<void> {
    return this.#client.call("invoke", "cmd", [cmd, ctx]) as Promise<void>;
  }

  eval(expr: string, ctx: Context = {}): Promise<unknown> {
    return this.#client.call("invoke", "eval", [expr, ctx]);
  }

  dispatch(name: string, fn: string, ...args: unknown[]): Promise<unknown> {
    return this.#client.call("invoke", "dispatch", [name, fn, ...args]);
  }
}
