import {
  readableStreamFromWorker,
  writableStreamFromWorker,
} from "https://deno.land/x/workerio@v3.1.0/mod.ts";

const worker = self as unknown as Worker;
const reader = readableStreamFromWorker(worker);
const writer = writableStreamFromWorker(worker);

const addr = Deno.env.get("DENOPS_TEST_ADDRESS");
if (!addr) {
  throw new Error("Environment variable `DENOPS_TEST_ADDRESS` is required");
}
const conn = await Deno.connect(JSON.parse(addr));

await Promise.race([
  reader.pipeTo(conn.writable),
  conn.readable.pipeTo(writer),
]);
