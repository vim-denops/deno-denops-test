import { assertSpyCall, spy } from "jsr:@std/testing@^1.0.0/mock";
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Denops } from "jsr:@denops/core@^7.0.0";
import { DenopsStub } from "./stub.ts";

Deno.test("`DenopsStub`", async (t) => {
  await t.step("implements `Denops` interface", () => {
    const _denops: Denops = new DenopsStub();
  });

  await t.step("`name` is a string", () => {
    const denops = new DenopsStub();
    assertEquals(denops.name, "denops-test-stub");
  });

  await t.step("`meta` is a `Meta`", () => {
    const denops = new DenopsStub();
    assertEquals(denops.meta, {
      mode: "release",
      host: "vim",
      version: "0.0.0",
      platform: "linux",
    });
  });

  await t.step("`context` is an empty `Record`", () => {
    const denops = new DenopsStub();
    assertEquals(denops.context, {});
  });

  await t.step("`context` is writable", () => {
    const denops = new DenopsStub();
    denops.context.foo = "bar";
    assertEquals(denops.context, { "foo": "bar" });
  });

  await t.step("`dispatcher` is an empty `Dispatcher`", () => {
    const denops = new DenopsStub();
    assertEquals(denops.dispatcher, {});
  });

  await t.step("`dispatcher` is writable", () => {
    const denops = new DenopsStub();
    const fn = () => {};
    denops.dispatcher.foo = fn;
    assertEquals(denops.dispatcher, { "foo": fn });
  });

  await t.step("`dispatcher` is assignable", () => {
    const denops = new DenopsStub();
    const fn = () => {};
    denops.dispatcher = { "foo": fn };
    assertEquals(denops.dispatcher, { "foo": fn });
  });

  await t.step("`redraw` returns a promise resolves to undefined", () => {
    const denops = new DenopsStub();
    assertEquals(denops.redraw(), Promise.resolve());
    assertEquals(denops.redraw(false), Promise.resolve());
    assertEquals(denops.redraw(true), Promise.resolve());
  });

  await t.step("`call` returns a promise resolves to undefined", () => {
    const denops = new DenopsStub();
    assertEquals(denops.call("foo"), Promise.resolve());
    assertEquals(denops.call("foo", "bar"), Promise.resolve());
  });

  await t.step("`batch` returns a promise resolves to an empty list", () => {
    const denops = new DenopsStub();
    assertEquals(denops.batch(), Promise.resolve([]));
    assertEquals(denops.batch(["foo"]), Promise.resolve([]));
    assertEquals(denops.batch(["foo", "bar"]), Promise.resolve([]));
    assertEquals(denops.batch(["foo"], ["foo", "bar"]), Promise.resolve([]));
  });

  await t.step("`cmd` returns a promise resolves to undefined", () => {
    const denops = new DenopsStub();
    assertEquals(denops.cmd("foo"), Promise.resolve());
    assertEquals(denops.cmd("foo", { "foo": "bar" }), Promise.resolve());
  });

  await t.step("`eval` returns a promise resolves to undefined", () => {
    const denops = new DenopsStub();
    assertEquals(denops.eval("foo"), Promise.resolve());
    assertEquals(denops.eval("foo", { "foo": "bar" }), Promise.resolve());
  });

  await t.step("`dispatch` returns a promise resolves to undefined", () => {
    const denops = new DenopsStub();
    assertEquals(denops.dispatch("foo", "bar"), Promise.resolve());
    assertEquals(denops.dispatch("foo", "bar", "hoge"), Promise.resolve());
  });
});

Deno.test("`DenopsStub` with `stubber`", async (t) => {
  await t.step("`name` is a specified string", () => {
    const denops = new DenopsStub({ name: "this-is-test" });
    assertEquals(denops.name, "this-is-test");
  });

  await t.step("`meta` is a specified `Meta`", () => {
    const denops = new DenopsStub({
      meta: {
        mode: "debug",
        host: "nvim",
        version: "1.2.3",
        platform: "windows",
      },
    });
    assertEquals(denops.meta, {
      mode: "debug",
      host: "nvim",
      version: "1.2.3",
      platform: "windows",
    });
  });

  await t.step("`redraw` invokes a specified `redraw`", async () => {
    const stubber = {
      redraw: spy(() => {
        return Promise.resolve();
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.redraw(), undefined);
    assertSpyCall(stubber.redraw, 0, {
      args: [undefined],
    });

    await denops.redraw(false);
    assertSpyCall(stubber.redraw, 1, {
      args: [false],
    });

    await denops.redraw(true);
    assertSpyCall(stubber.redraw, 2, {
      args: [true],
    });
  });

  await t.step("`call` invokes a specified `call`", async () => {
    const stubber = {
      call: spy((fn, ...args) => {
        return Promise.resolve([fn, ...args]);
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.call("foo"), ["foo"]);
    assertSpyCall(stubber.call, 0, {
      args: ["foo"],
    });

    assertEquals(await denops.call("foo", "bar"), ["foo", "bar"]);
    assertSpyCall(stubber.call, 1, {
      args: ["foo", "bar"],
    });

    // NOTE: args is normalized
    assertEquals(await denops.call("foo", undefined, "bar"), ["foo"]);
    assertSpyCall(stubber.call, 2, {
      args: ["foo"],
    });
  });

  await t.step("`batch` invokes a specified `batch`", async () => {
    const stubber = {
      batch: spy((...calls) => {
        return Promise.resolve(calls);
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.batch(["foo"], ["foo", "bar"]), [
      ["foo"],
      ["foo", "bar"],
    ]);
    assertSpyCall(stubber.batch, 0, {
      args: [["foo"], ["foo", "bar"]],
    });

    // NOTE: args is normalized
    assertEquals(await denops.batch(["foo", undefined, "bar"]), [["foo"]]);
    assertSpyCall(stubber.batch, 1, {
      args: [["foo"]],
    });
  });

  await t.step(
    "`batch` invokes a specified `call` when `useCallInBatch` is true",
    async () => {
      const stubber = {
        call: spy((fn, ...args) => {
          return Promise.resolve([fn, ...args]);
        }),
        useCallInBatch: true,
      };
      const denops = new DenopsStub(stubber);
      assertEquals(await denops.batch(["foo"], ["foo", "bar"]), [
        ["foo"],
        ["foo", "bar"],
      ]);
      assertSpyCall(stubber.call, 0, {
        args: ["foo"],
      });
      assertSpyCall(stubber.call, 1, {
        args: ["foo", "bar"],
      });
    },
  );

  await t.step("`cmd` invokes a specified `cmd`", async () => {
    const stubber = {
      cmd: spy((_cmd, _ctx) => {
        return Promise.resolve();
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.cmd("foo"), undefined);
    assertSpyCall(stubber.cmd, 0, {
      args: ["foo", {}],
    });

    assertEquals(await denops.cmd("foo", { "foo": "bar" }), undefined);
    assertSpyCall(stubber.cmd, 1, {
      args: ["foo", { "foo": "bar" }],
    });
  });

  await t.step(
    "`cmd` invokes a specified `call` when `useCallInCmd` is true",
    async () => {
      const stubber = {
        call: spy((fn, ...args) => {
          return Promise.resolve([fn, ...args]);
        }),
        useCallInCmd: true,
      };
      const denops = new DenopsStub(stubber);
      assertEquals(await denops.cmd("foo"), undefined);
      assertSpyCall(stubber.call, 0, {
        args: ["denops#api#cmd", "foo", {}],
      });

      assertEquals(await denops.cmd("foo", { "foo": "bar" }), undefined);
      assertSpyCall(stubber.call, 1, {
        args: ["denops#api#cmd", "foo", { "foo": "bar" }],
      });
    },
  );

  await t.step("`eval` invokes a specified `eval`", async () => {
    const stubber = {
      eval: spy((expr, ctx) => {
        return Promise.resolve([expr, ctx]);
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.eval("foo"), ["foo", {}]);
    assertSpyCall(stubber.eval, 0, {
      args: ["foo", {}],
    });

    assertEquals(await denops.eval("foo", { "foo": "bar" }), ["foo", {
      "foo": "bar",
    }]);
    assertSpyCall(stubber.eval, 1, {
      args: ["foo", { "foo": "bar" }],
    });
  });

  await t.step(
    "`eval` invokes a specified `call` when `useCallInEval` is true",
    async () => {
      const stubber = {
        call: spy((fn, ...args) => {
          return Promise.resolve([fn, ...args]);
        }),
        useCallInEval: true,
      };
      const denops = new DenopsStub(stubber);
      assertEquals(await denops.eval("foo"), ["denops#api#eval", "foo", {}]);
      assertSpyCall(stubber.call, 0, {
        args: ["denops#api#eval", "foo", {}],
      });

      assertEquals(await denops.eval("foo", { "foo": "bar" }), [
        "denops#api#eval",
        "foo",
        {
          "foo": "bar",
        },
      ]);
      assertSpyCall(stubber.call, 1, {
        args: ["denops#api#eval", "foo", { "foo": "bar" }],
      });
    },
  );

  await t.step("`dispatch` invokes a specified `dispatch`", async () => {
    const stubber = {
      dispatch: spy((name, fn, ...args) => {
        return Promise.resolve([name, fn, ...args]);
      }),
    };
    const denops = new DenopsStub(stubber);
    assertEquals(await denops.dispatch("foo", "bar"), ["foo", "bar"]);
    assertSpyCall(stubber.dispatch, 0, {
      args: ["foo", "bar"],
    });

    assertEquals(await denops.dispatch("foo", "bar", "hoge"), [
      "foo",
      "bar",
      "hoge",
    ]);
    assertSpyCall(stubber.dispatch, 1, {
      args: ["foo", "bar", "hoge"],
    });
  });
});
