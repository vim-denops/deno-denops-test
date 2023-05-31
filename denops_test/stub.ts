import {
  Context,
  Denops,
  Dispatcher,
  Meta,
} from "https://deno.land/x/denops_core@v5.0.0/mod.ts";

/**
 * Represents a `Denops` stubber object.
 */
export type DenopsStubber = {
  /**
   * Denops instance name whihc uses to communicate with vim.
   *
   * If not specified, the default value is `denops-test-stub`.
   */
  name?: string;
  /**
   * Environment meta information.
   *
   * If not specified, the default value is:
   * ```json
   * {
   *   "mode": "release",
   *   "host": "vim",
   *   "version": "0.0.0",
   *   "platform": "linux"
   * }
   * ```
   */
  meta?: Meta;
  /**
   * A stub function of `redraw` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to undefined.
   */
  redraw?: (force?: boolean) => Promise<void>;
  /**
   * A stub function of `call` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to undefined.
   */
  call?(fn: string, ...args: unknown[]): Promise<unknown>;
  /**
   * A stub function of `batch` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to an empty list.
   */
  batch?(...calls: [string, ...unknown[]][]): Promise<unknown[]>;
  /**
   * A stub function of `cmd` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to undefined.
   */
  cmd?(cmd: string, ctx: Context): Promise<void>;
  /**
   * A stub function of `eval` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to undefined.
   */
  eval?(expr: string, ctx: Context): Promise<unknown>;
  /**
   * A stub function of `dispatch` method of the `Denops`.
   *
   * If not specified, it returns a promise resolves to undefined.
   */
  dispatch?(name: string, fn: string, ...args: unknown[]): Promise<unknown>;
  /**
   * Indicates whether to use `call` function in `batch` method.
   */
  useCallInBatch?: boolean;
  /**
   * Indicates whether to use `call` function in `cmd` method.
   */
  useCallInCmd?: boolean;
  /**
   * Indicates whether to use `call` function in `eval` method.
   */
  useCallInEval?: boolean;
};

/**
 * Represents a `Denops` stub object.
 */
export class DenopsStub implements Denops {
  readonly context: Record<string | number | symbol, unknown> = {};
  dispatcher: Dispatcher = {};

  #stubber: DenopsStubber;

  /**
   * Creates a new instance of DenopsStub.
   * @param stubber - The Denops stubber object.
   */
  constructor(stubber: DenopsStubber = {}) {
    this.#stubber = stubber;
  }

  get name(): string {
    return this.#stubber.name ?? "denops-test-stub";
  }

  get meta(): Meta {
    return this.#stubber.meta ?? {
      mode: "release",
      host: "vim",
      version: "0.0.0",
      platform: "linux",
    };
  }

  redraw(force?: boolean): Promise<void> {
    if (this.#stubber.redraw) {
      return this.#stubber.redraw(force);
    }
    return Promise.resolve();
  }

  call(fn: string, ...args: unknown[]): Promise<unknown> {
    if (this.#stubber.call) {
      args = normArgs(args);
      return this.#stubber.call(fn, ...args);
    }
    return Promise.resolve();
  }

  batch(...calls: [string, ...unknown[]][]): Promise<unknown[]> {
    if (this.#stubber.batch) {
      calls = calls.map(([fn, ...args]) => [fn, ...normArgs(args)]);
      return this.#stubber.batch(...calls);
    }
    if (this.#stubber.call && this.#stubber.useCallInBatch) {
      return Promise.all(
        calls.map(([fn, ...args]) => this.call(fn, ...args)),
      );
    }
    return Promise.resolve(calls.map(() => undefined));
  }

  cmd(cmd: string, ctx: Context = {}): Promise<void> {
    if (this.#stubber.cmd) {
      return this.#stubber.cmd(cmd, ctx);
    }
    if (this.#stubber.call && this.#stubber.useCallInCmd) {
      return this.call("denops#api#cmd", cmd, ctx).then(() => {});
    }
    return Promise.resolve();
  }

  eval(expr: string, ctx: Context = {}): Promise<unknown> {
    if (this.#stubber.eval) {
      return this.#stubber.eval(expr, ctx);
    }
    if (this.#stubber.call && this.#stubber.useCallInEval) {
      return this.call("denops#api#eval", expr, ctx);
    }
    return Promise.resolve();
  }

  dispatch(
    name: string,
    fn: string,
    ...args: unknown[]
  ): Promise<unknown> {
    if (this.#stubber.dispatch) {
      return this.#stubber.dispatch(name, fn, ...args);
    }
    return Promise.resolve();
  }
}

function normArgs(args: unknown[]): unknown[] {
  const normArgs = [];
  for (const arg of args) {
    if (arg === undefined) {
      break;
    }
    normArgs.push(arg);
  }
  return normArgs;
}
