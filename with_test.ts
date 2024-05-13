import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertFalse,
  assertRejects,
} from "jsr:@std/assert@0.225.1";
import { assertSpyCalls, spy, stub } from "jsr:@std/testing@0.224.0/mock";
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
  Deno.test(`test(mode:${mode}) outputs ${mode} messages if 'verbose' option is true`, async () => {
    using s = stub(console, "error");
    await withDenops(mode, async (denops: Denops) => {
      await denops.cmd("echomsg 'Hello. Hello. Hello. Hello. Hello. Hello.'");
      await denops.cmd("echomsg 'World. World. World. World. World. World.'");
    }, { verbose: true });
    const rawOutput = s.calls.map((c) => c.args[0]);
    const normOutput = rawOutput.join("").split("\r\n").map((v) => v.trim());
    //
    // NOTE:
    //
    // It appears that Neovim doesn't insert any delimiters between consecutive 'echomsg' calls,
    // and the chunk lengths are unstable as a result.
    // This inconsistency causes issues with Neovim's verbose output, but we couldn't find a workaround
    // to resolve this problem.
    // Interestingly, this issue only arises when producing verbose output using denops.vim, making it
    // difficult for us to reproduce the phenomenon and report it to Neovim's issue tracker.
    // While verbose output is essential for debugging, we're forced to accept our current situation.
    //
    if (mode === "vim") {
      assertArrayIncludes(normOutput, [
        "Hello. Hello. Hello. Hello. Hello. Hello.",
        "World. World. World. World. World. World.",
      ]);
    } else {
      assertArrayIncludes(normOutput, [
        "Hello. Hello. Hello. Hello. Hello. Hello.World. World. World. World. World. World.",
      ]);
    }
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#redraw()`, async () => {
    await withDenops("vim", async (denops: Denops) => {
      await denops.redraw();
      await denops.redraw(true);
      // FIXME: assert redraw is correctly called.
    });
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#call()`, async () => {
    await withDenops("vim", async (denops: Denops) => {
      await denops.call("execute", [`let g:with_test__${mode}__call = 'foo'`]);
      assertEquals(await denops.eval(`g:with_test__${mode}__call`), "foo");
    });
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#batch()`, async () => {
    await withDenops("vim", async (denops: Denops) => {
      await denops.batch(
        ["execute", [`let g:with_test__${mode}__batch_1 = 'foo'`]],
        ["execute", [`let g:with_test__${mode}__batch_2 = 'bar'`]],
      );
      assertEquals(await denops.eval(`g:with_test__${mode}__batch_1`), "foo");
      assertEquals(await denops.eval(`g:with_test__${mode}__batch_2`), "bar");
    });
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#cmd()`, async () => {
    await withDenops("vim", async (denops: Denops) => {
      await denops.cmd(`let g:with_test__${mode}__cmd = 'foo'`);
      assertEquals(await denops.eval(`g:with_test__${mode}__cmd`), "foo");
    });
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#eval()`, async () => {
    await withDenops("vim", async (denops: Denops) => {
      await denops.eval(`execute('let g:with_test__${mode}__eval = "foo"')`);
      assertEquals(await denops.eval(`g:with_test__${mode}__eval`), "foo");
    });
  });

  Deno.test(`test(mode:${mode}) should be able to call Denops#dispatch()`, async () => {
    const api = spy(() => Promise.resolve());
    await withDenops("vim", async (denops: Denops) => {
      denops.dispatcher = {
        foo: api,
      };
      await denops.dispatch(denops.name, "foo", [123, "bar"]);
      assertSpyCalls(api, 1);
    });
  });

  Deno.test(`test(mode:${mode}) calls plugin dispatcher from ${mode}`, async () => {
    const api = spy(() => Promise.resolve());
    await withDenops("vim", async (denops: Denops) => {
      denops.dispatcher = {
        foo: api,
      };
      await denops.call("denops#notify", denops.name, "foo", [123, "bar"]);
      assertSpyCalls(api, 1);
    });
  });

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
