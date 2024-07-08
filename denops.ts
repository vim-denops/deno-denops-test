import type {
  Context,
  Denops,
  Dispatcher,
  Meta,
} from "jsr:@denops/core@7.0.0-pre1";
import type { Client } from "jsr:@lambdalisue/messagepack-rpc@2.1.1";

export class DenopsImpl implements Denops {
  readonly name: string;
  readonly meta: Meta;
  readonly context: Record<string | number | symbol, unknown> = {};
  readonly interrupted = AbortSignal.any([]);

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

  call(fn: string, ...args: unknown[]): Promise<unknown> {
    return this.#client.call("invoke", "call", [fn, ...args]);
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
