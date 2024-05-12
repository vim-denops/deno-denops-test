# 📝 denops_test

[![Test](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml/badge.svg)](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/denops_test/mod.ts)
[![deno land](http://img.shields.io/badge/available%20on-deno.land/x/denops__test-lightgrey.svg?logo=deno)](https://deno.land/x/denops_test)
[![codecov](https://codecov.io/github/vim-denops/deno-denops-test/branch/main/graph/badge.svg?token=X9O5XB4O1S)](https://codecov.io/github/vim-denops/deno-denops-test)

A [Deno] module designed for testing [denops.vim]. This module is intended to be
used in the unit tests of denops plugins.

[deno]: https://deno.land/
[denops.vim]: https://github.com/vim-denops/denops.vim

> [!NOTE]
>
> To use the `test` function, an environment variable `DENOPS_TEST_DENOPS_PATH`
> is required. Clone the [denops.vim] repository and set the path to this
> environment variable.
>
> Additionally, the following environment variables are available to configure
> the behavior of the `test` function:
>
> - `DENOPS_TEST_VIM_EXECUTABLE`: Path to the Vim executable (default: "vim")
> - `DENOPS_TEST_NVIM_EXECUTABLE`: Path to the Neovim executable (default:
>   "nvim")
> - `DENOPS_TEST_VERBOSE`: `1` or `true` to print Vim messages (echomsg)

If you want to test denops plugins with a real Vim and/or Neovim process, use
the `test` function to define a test case, as shown below:

```typescript
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import { test } from "https://deno.land/x/denops_test@$MODULE_VERSION/mod.ts";

test(
  "vim",
  "Start Vim to test denops features",
  async (denops) => {
    assertFalse(await denops.call("has", "nvim"));
  },
);

test({
  mode: "nvim",
  name: "Start Neovim to test denops features",
  fn: async (denops) => {
    assert(await denops.call("has", "nvim"));
  },
});

test({
  mode: "all",
  name: "Start Vim and Neovim to test denops features",
  fn: async (denops) => {
    assertEquals(await denops.call("abs", -4), 4);
  },
});

test({
  mode: "any",
  name: "Start Vim or Neovim to test denops features",
  fn: async (denops) => {
    assertEquals(await denops.call("abs", -4), 4);
  },
});
```

If you want to test denops plugins without a real Vim and/or Neovim process, use
the `DenopsStub` class to create a stub instance of the `Denops` interface, as
shown below:

```typescript
import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { DenopsStub } from "https://deno.land/x/denops_test@$MODULE_VERSION/mod.ts";

Deno.test("denops.call", async () => {
  const denops = new DenopsStub({
    call: (fn, ...args) => {
      return Promise.resolve([fn, ...args]);
    },
  });
  assertEquals(await denops.call("foo", "bar"), ["foo", "bar"]);
});
```

## License

The code follows the MIT license, as stated in [LICENSE](./LICENSE).
Contributors are required to agree that any modifications submitted to this
repository adhere to the license.
