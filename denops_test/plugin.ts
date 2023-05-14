import { copy } from "https://deno.land/std@0.187.0/streams/copy.ts";
import {
  WorkerReader,
  WorkerWriter,
} from "https://deno.land/x/workerio@v3.1.0/mod.ts#^";
import { orElse } from "./or_else.ts";

const worker = self as unknown as Worker;
const reader = new WorkerReader(worker);
const writer = new WorkerWriter(worker);

const addr = JSON.parse(orElse(Deno.env.get("DENOPS_TEST_ADDRESS"), () => {
  throw new Error("Environment variable `DENOPS_TEST_ADDRESS` is required");
}));
const conn = await Deno.connect(addr);

await Promise.race([
  copy(conn, writer).finally(() => conn.close()),
  copy(reader, conn),
]);
