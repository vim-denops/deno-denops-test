import type { Denops } from "https://deno.land/x/denops_core@v6.0.2/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  Client,
  Session,
} from "https://deno.land/x/messagepack_rpc@v2.0.3/mod.ts";
import { errorDeserializer, errorSerializer } from "./error.ts";

export async function main(denops: Denops): Promise<void> {
  const addr = Deno.env.get("DENOPS_TEST_ADDRESS");
  if (!addr) {
    throw new Error("Environment variable 'DENOPS_TEST_ADDRESS' is not set");
  }
  const conn = await Deno.connect(JSON.parse(addr));
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
  session.dispatcher = {
    invoke: (name, args) => {
      assert(name, is.String);
      assert(args, is.Array);
      return invoke(denops, name, args);
    },
  };
  denops.dispatcher = new Proxy({}, {
    get: (_, prop) => {
      assert(prop, is.String);
      return (...args: unknown[]) => {
        return client.call("dispatch", prop, args);
      };
    },
    set: () => {
      throw new Error("This dispatcher is for test and read-only");
    },
    deleteProperty: () => {
      throw new Error("This dispatcher is for test and read-only");
    },
  });
}

function invoke(
  denops: Denops,
  name: string,
  args: unknown[],
): Promise<unknown> {
  switch (name) {
    case "redraw":
      return denops.redraw(...ensure(args, isRedrawArgs));
    case "call":
      return denops.call(...ensure(args, isCallArgs));
    case "batch":
      return denops.batch(...ensure(args, isBatchArgs));
    case "cmd":
      return denops.cmd(...ensure(args, isCmdArgs));
    case "eval":
      return denops.eval(...ensure(args, isEvalArgs));
    case "dispatch":
      return denops.dispatch(...ensure(args, isDispatchArgs));
    default:
      throw new Error(`Unknown denops method '${name}' is specified`);
  }
}

const isRedrawArgs = is.TupleOf([is.OptionalOf(is.Boolean)] as const);

const isCallArgs = (v: unknown): v is [string, ...unknown[]] => {
  return is.Array(v) && is.String(v[0]);
};

const isBatchArgs = is.ArrayOf(isCallArgs);

const isCmdArgs = is.TupleOf([is.String, is.OptionalOf(is.Record)] as const);

const isEvalArgs = is.TupleOf([is.String, is.OptionalOf(is.Record)] as const);

const isDispatchArgs = (v: unknown): v is [string, string, ...unknown[]] => {
  return is.Array(v) && is.String(v[0]) && is.String(v[1]);
};
