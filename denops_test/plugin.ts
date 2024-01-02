import {
  readableStreamFromWorker,
  writableStreamFromWorker,
} from "https://deno.land/x/workerio@v3.1.0/mod.ts";
import { orElse } from "./or_else.ts";

const worker = self as unknown as Worker;
const reader = readableStreamFromWorker(worker);
const writer = writableStreamFromWorker(worker);

const addr = JSON.parse(orElse(Deno.env.get("DENOPS_TEST_ADDRESS"), () => {
  throw new Error("Environment variable `DENOPS_TEST_ADDRESS` is required");
}));
const conn = await Deno.connect(addr);

await Promise.race([
  reader.pipeTo(conn.writable),
  conn.readable.pipeTo(writer),
]);
