import type {
  Context,
  Denops,
  Dispatcher,
  Meta,
} from "jsr:@denops/core@^7.0.0";

/**
 * Represents a stubber object for `Denops`.
 */
export interface DenopsStubber {
  /**
   * The name used to communicate with Vim.
   * If not specified, the default value is `denops-test-stub`.
   */
  name?: string;
  /**
   * Environment meta information.
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
   * AbortSignal instance that is triggered when the user invoke `denops#interrupt()`
   * If not specified, it returns a new instance of `AbortSignal`.
   */
  interrupted?: AbortSignal;
  /**
   * A stub function for the `redraw` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   */
  redraw?: (force?: boolean) => Promise<void>;
  /**
   * A stub function for the `call` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   */
  call?(fn: string, ...args: unknown[]): Promise<unknown>;
  /**
   * A stub function for the `batch` method of `Denops`.
   * If not specified, it returns a promise resolving to an empty list.
   */
  batch?(...calls: [string, ...unknown[]][]): Promise<unknown[]>;
  /**
   * A stub function for the `cmd` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   */
  cmd?(cmd: string, ctx: Context): Promise<void>;
  /**
   * A stub function for the `eval` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   */
  eval?(expr: string, ctx: Context): Promise<unknown>;
  /**
   * A stub function for the `dispatch` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   */
  dispatch?(name: string, fn: string, ...args: unknown[]): Promise<unknown>;
  /**
   * Indicates whether to use the `call` function in the `batch` method.
   */
  useCallInBatch?: boolean;
  /**
   * Indicates whether to use the `call` function in the `cmd` method.
   */
  useCallInCmd?: boolean;
  /**
   * Indicates whether to use the `call` function in the `eval` method.
   */
  useCallInEval?: boolean;
}

/**
 * Represents a stub object for `Denops`.
 */
export class DenopsStub implements Denops {
  readonly context: Record<string | number | symbol, unknown> = {};
  dispatcher: Dispatcher = {};

  #stubber: DenopsStubber;

  /**
   * Creates a new instance of `DenopsStub`.
   * @param stubber - The `DenopsStubber` object.
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

  get interrupted(): AbortSignal {
    return this.#stubber.interrupted ?? AbortSignal.any([]);
  }

  /**
   * A stub function for the `redraw` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   *
   * @param force - A boolean flag indicating whether to force redraw.
   */
  redraw(force?: boolean): Promise<void> {
    if (this.#stubber.redraw) {
      return this.#stubber.redraw(force);
    }
    return Promise.resolve();
  }

  /**
   * A stub function for the `call` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   *
   * @param fn - The function name to call.
   * @param args - The arguments for the function.
   */
  call(fn: string, ...args: unknown[]): Promise<unknown> {
    if (this.#stubber.call) {
      args = normArgs(args);
      return this.#stubber.call(fn, ...args);
    }
    return Promise.resolve();
  }

  /**
   * A stub function for the `batch` method of `Denops`.
   * If not specified, it returns a promise resolving to an empty list.
   *
   * @param calls - An array of tuples representing function calls.
   */
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

  /**
   * A stub function for the `cmd` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   *
   * @param cmd - The command to execute.
   * @param ctx - The context object.
   */
  cmd(cmd: string, ctx: Context = {}): Promise<void> {
    if (this.#stubber.cmd) {
      return this.#stubber.cmd(cmd, ctx);
    }
    if (this.#stubber.call && this.#stubber.useCallInCmd) {
      return this.call("denops#api#cmd", cmd, ctx).then(() => {});
    }
    return Promise.resolve();
  }

  /**
   * A stub function for the `eval` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   *
   * @param expr - The expression to evaluate.
   * @param ctx - The context object.
   */
  eval(expr: string, ctx: Context = {}): Promise<unknown> {
    if (this.#stubber.eval) {
      return this.#stubber.eval(expr, ctx);
    }
    if (this.#stubber.call && this.#stubber.useCallInEval) {
      return this.call("denops#api#eval", expr, ctx);
    }
    return Promise.resolve();
  }

  /**
   * A stub function for the `dispatch` method of `Denops`.
   * If not specified, it returns a promise resolving to undefined.
   *
   * @param name - The plugin registration name.
   * @param fn - The function name in the API registration.
   * @param args - The arguments for the function.
   */
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

/**
 * Normalizes arguments by removing `undefined` values.
 *
 * @param args - The arguments to normalize.
 */
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
