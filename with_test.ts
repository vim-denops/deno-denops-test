import {
  assert,
  assertFalse,
  assertRejects,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.210.0/testing/mock.ts";
import type { Denops } from "https://deno.land/x/denops_core@v6.0.2/mod.ts";
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
