# denops_test

[![Test](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml/badge.svg)](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/denops_test/mod.ts)
[![deno land](http://img.shields.io/badge/available%20on-deno.land/x/denops__test-lightgrey.svg?logo=deno)](https://deno.land/x/denops_test)
[![codecov](https://codecov.io/github/vim-denops/deno-denops-test/branch/main/graph/badge.svg?token=X9O5XB4O1S)](https://codecov.io/github/vim-denops/deno-denops-test)

[Deno][deno] module for testing [denops.vim][denops.vim]. This module is assumed
to be used in unittests of denops plugin.

[deno]: https://deno.land/
[denops.vim]: https://github.com/vim-denops/denops.vim

By using this module, developers can write denops tests like:

```typescript
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { test } from "./tester.ts";

test(
  "vim",
  "test(mode:vim) start vim to test denops features",
  async (denops) => {
    assertFalse(await denops.call("has", "nvim"));
  },
);

test({
  mode: "nvim",
  name: "test(mode:nvim) start nvim to test denops features",
  fn: async (denops) => {
    assert(await denops.call("has", "nvim"));
  },
});

test({
  mode: "any",
  name: "test(mode:any) start vim or nvim to test denops features",
  fn: async (denops) => {
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
});

test({
  mode: "all",
  name: "test(mode:all) start both vim and nvim to test denops features",
  fn: async (denops) => {
    assertEquals(
      await denops.call("range", 10),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  },
});
```
