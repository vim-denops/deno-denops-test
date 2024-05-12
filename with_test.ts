import { assert, assertFalse, assertRejects } from "jsr:@std/assert@0.225.1";
import { assertSpyCalls, spy } from "jsr:@std/testing@0.224.0/mock";
import type { Denops } from "jsr:@denops/core@6.0.6";
import { withDenops } from "./with.ts";

Deno.test("test(mode:vim) start vim to test denops features", async () => {
  const main = spy(async (denops: Denops) => {
    assertFalse(await denops.call("has", "nvim"));
  });
  await withDenops("vim", main);
  assertSpyCalls(main, 1);
});

Deno.test("test(mode:nvim) start nvim to test denops features", async () => {
  const main = spy(async (denops: Denops) => {
    assert(await denops.call("has", "nvim"));
  });
  await withDenops("nvim", main);
  assertSpyCalls(main, 1);
});

for (const mode of ["vim", "nvim"] as const) {
  Deno.test(`test(mode:${mode}) rejects if process aborted`, async () => {
    const fn = spy(() => {});
    await assertRejects(
      async () => {
        await withDenops(mode, fn, {
          prelude: [
            "echomsg 'foobar'",
            "cquit",
          ],
        });
      },
      Error,
      "foobar",
    );
    assertSpyCalls(fn, 0);
  });

  Deno.test(`test(mode:${mode}) rejects if connection failed`, async () => {
    const fn = spy(() => {});
    await assertRejects(
      async () => {
        await withDenops(mode, fn, {
          prelude: ["sleep 1"], // Set sleep [s] longer than timeout
          connectTimeout: 10, // Set timeout [ms] shorter than sleep
        });
      },
      Error,
      "Connection failed",
    );
    assertSpyCalls(fn, 0);
  });
}
