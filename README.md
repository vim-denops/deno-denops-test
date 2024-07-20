# 📝 denops_test

[![JSR](https://jsr.io/badges/@denops/test)](https://jsr.io/@denops/test)
[![Test](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml/badge.svg)](https://github.com/vim-denops/deno-denops-test/actions/workflows/test.yml)
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
> - `DENOPS_TEST_CONNECT_TIMEOUT`: Timeout [ms] for connecting to Vim/Neovim
>   (default: 30000)

If you want to test denops plugins with a real Vim and/or Neovim process, use
the `test` function to define a test case, as shown below:

```typescript
import { assert, assertEquals, assertFalse } from "jsr:@std/assert";
import { test } from "jsr:@denops/test";

test("vim", "Start Vim to test denops features", async (denops) => {
  assertFalse(await denops.call("has", "nvim"));
});

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
import { assertEquals } from "jsr:@std/assert";
import { DenopsStub } from "jsr:@denops/test";

Deno.test("denops.call", async () => {
  const denops = new DenopsStub({
    call: (fn, ...args) => {
      return Promise.resolve([fn, ...args]);
    },
  });
  assertEquals(await denops.call("foo", "bar"), ["foo", "bar"]);
});
```

## GitHub Action

Copy and modify the following GitHub Workflow to run tests in GitHub Action

```yaml
# Use 'bash' as default shell even on Windows
defaults:
  run:
    shell: bash --noprofile --norc -eo pipefail {0}

jobs:
  test:
    strategy:
      matrix:
        runner:
          - windows-latest
          - macos-latest
          - ubuntu-latest
        deno_version:
          - "1.45.x"
          - "1.x"
        host_version:
          - vim: "v9.1.0448"
            nvim: "v0.10.0"

    runs-on: ${{ matrix.runner }}

    steps:
      - run: git config --global core.autocrlf false
        if: runner.os == 'Windows'

      - uses: actions/checkout@v4

      - uses: denoland/setup-deno@v1
        with:
          deno-version: ${{ matrix.deno_version }}

      - name: Get denops
        run: |
          git clone https://github.com/vim-denops/denops.vim /tmp/denops.vim
          echo "DENOPS_TEST_DENOPS_PATH=/tmp/denops.vim" >> "$GITHUB_ENV"

      - uses: rhysd/action-setup-vim@v1
        id: vim
        with:
          version: ${{ matrix.host_version.vim }}

      - uses: rhysd/action-setup-vim@v1
        id: nvim
        with:
          neovim: true
          version: ${{ matrix.host_version.nvim }}

      - name: Export executables
        run: |
          echo "DENOPS_TEST_VIM_EXECUTABLE=${{ steps.vim.outputs.executable }}" >> "$GITHUB_ENV"
          echo "DENOPS_TEST_NVIM_EXECUTABLE=${{ steps.nvim.outputs.executable }}" >> "$GITHUB_ENV"

      - name: Check versions
        run: |
          deno --version
          ${DENOPS_TEST_VIM_EXECUTABLE} --version
          ${DENOPS_TEST_NVIM_EXECUTABLE} --version

      - name: Perform pre-cache
        run: |
          deno cache ${DENOPS_TEST_DENOPS_PATH}/denops/@denops-private/mod.ts
          deno cache ./denops/your_plugin/main.ts

      - name: Run tests
        run: deno test -A
```

## For developers

This library may be called from denops itself so import map is not available.

## License

The code follows the MIT license, as stated in [LICENSE](./LICENSE).
Contributors are required to agree that any modifications submitted to this
repository adhere to the license.
