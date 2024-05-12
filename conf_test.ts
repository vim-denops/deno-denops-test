import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "jsr:@std/assert@0.225.1";
import { stub } from "jsr:@std/testing@0.224/mock";
import { basename, isAbsolute } from "jsr:@std/path@0.224.0";
import { _internal, getConfig } from "./conf.ts";

const ENV_VARS: Readonly<Record<string, string | undefined>> = {
  DENOPS_TEST_DENOPS_PATH: "denops.vim",
  DENOPS_TEST_VIM_EXECUTABLE: undefined,
  DENOPS_TEST_NVIM_EXECUTABLE: undefined,
  DENOPS_TEST_VERBOSE: undefined,
  DENOPS_TEST_CONNECT_TIMEOUT: undefined,
};

function stubEnvVars(envVars: Readonly<Record<string, string | undefined>>) {
  return stub(Deno.env, "get", (name) => envVars[name]);
}

function stubConfModule(): Disposable {
  const savedConf = getConfig();
  _internal.resetConfig(undefined);
  return {
    [Symbol.dispose]() {
      _internal.resetConfig(savedConf);
    },
  };
}

Deno.test("getConfig() throws if DENOPS_TEST_DENOPS_PATH env var is not set", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_DENOPS_PATH: undefined });
  assertThrows(
    () => {
      getConfig();
    },
    Error,
    "'DENOPS_TEST_DENOPS_PATH' is required",
  );
});

Deno.test("getConfig() returns `{ denopsPath: ... }` with resolved DENOPS_TEST_DENOPS_PATH env var", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_DENOPS_PATH: "foo" });
  const actual = getConfig();
  assert(isAbsolute(actual.denopsPath), "`denopsPath` should be absolute path");
  assertEquals(basename(actual.denopsPath), "foo");
});

Deno.test("getConfig() returns `{ vimExecutable: 'vim' }` if DENOPS_TEST_VIM_EXECUTABLE env var is not set", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({
    ...ENV_VARS,
    DENOPS_TEST_VIM_EXECUTABLE: undefined,
  });
  const actual = getConfig();
  assertObjectMatch(actual, { vimExecutable: "vim" });
});

Deno.test("getConfig() returns `{ vimExecutable: ... }` with DENOPS_TEST_VIM_EXECUTABLE env var", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_VIM_EXECUTABLE: "foo" });
  const actual = getConfig();
  assertObjectMatch(actual, { vimExecutable: "foo" });
});

Deno.test("getConfig() returns `{ nvimExecutable: 'nvim' }` if DENOPS_TEST_NVIM_EXECUTABLE env var is not set", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({
    ...ENV_VARS,
    DENOPS_TEST_NVIM_EXECUTABLE: undefined,
  });
  const actual = getConfig();
  assertObjectMatch(actual, { nvimExecutable: "nvim" });
});

Deno.test("getConfig() returns `{ nvimExecutable: ... }` with DENOPS_TEST_NVIM_EXECUTABLE env var", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_NVIM_EXECUTABLE: "foo" });
  const actual = getConfig();
  assertObjectMatch(actual, { nvimExecutable: "foo" });
});

Deno.test("getConfig() returns `{ verbose: false }` if DENOPS_TEST_VERBOSE env var is not set", () => {
  using _module = stubConfModule();
  using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_VERBOSE: undefined });
  const actual = getConfig();
  assertObjectMatch(actual, { verbose: false });
});

for (
  const [input, expected] of [
    ["false", false],
    ["0", false],
    ["invalid", false],
    ["true", true],
    ["1", true],
  ] as const
) {
  Deno.test(`getConfig() returns \`{ verbose: ${expected} }\` if DENOPS_TEST_VERBOSE env var is '${input}'`, () => {
    using _module = stubConfModule();
    using _env = stubEnvVars({ ...ENV_VARS, DENOPS_TEST_VERBOSE: input });
    const actual = getConfig();
    assertObjectMatch(actual, { verbose: expected });
  });
}

for (
  const [input, expected] of [
    ["123", 123],
    ["123.456", 123],
    ["0", undefined],
    ["-123", undefined],
    ["string", undefined],
  ] as const
) {
  Deno.test(`getConfig() returns \`{ connectTimeout: ${expected} }\` if DENOPS_TEST_CONNECT_TIMEOUT env var is '${input}'`, () => {
    using _module = stubConfModule();
    using _env = stubEnvVars({
      ...ENV_VARS,
      DENOPS_TEST_CONNECT_TIMEOUT: input,
    });
    const actual = getConfig();
    assertObjectMatch(actual, { connectTimeout: expected });
  });
}
