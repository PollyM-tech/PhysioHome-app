const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const account = {
  id: 1,
  full_name: "Test Patient",
  role: "patient",
  account_status: "active",
  verification_status: null,
};
const tokens = { access: "access-1", refresh: "refresh-1", user: account };
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(data),
});
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function loadClient(fetch, platform = "web") {
  const stored = new Map();
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("lib/auth/client.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    fetch,
    process: { env: { EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN: "http://api.test" } },
    setTimeout,
    clearTimeout,
    AbortController,
    require: (name) => {
      if (name === "react-native") return { Platform: { OS: platform } };
      if (name === "expo-secure-store")
        return {
          getItemAsync: async (key) => stored.get(key) ?? null,
          setItemAsync: async (key, value) => stored.set(key, value),
          deleteItemAsync: async (key) => stored.delete(key),
        };
      throw Error(`Unexpected module ${name}`);
    },
  });
  return { client: exports, stored };
}

test("native login stores only refresh credentials and uses Bearer access", async () => {
  const { client, stored } = loadClient(async (url, options) => {
    if (url.endsWith("auth/login/")) return response(tokens);
    assert.equal(options.headers.Authorization, "Bearer access-1");
    return response(account);
  }, "ios");
  await client.login("patient@example.com", "password", "patient");
  assert.deepEqual([...stored.values()], ["refresh-1"]);
  await client.currentAccount();
});

test("browser login uses CSRF and cookies without persistent JS storage", async () => {
  const { client, stored } = loadClient(async (url, options) => {
    if (url.endsWith("csrf/")) return response({ csrfToken: "csrf-token" });
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["X-CSRFToken"], "csrf-token");
    assert.equal(JSON.parse(options.body).transport, "cookie");
    return response({ access: tokens.access, user: account });
  });
  await client.login("patient@example.com", "password", "patient");
  assert.equal(stored.size, 0);
});

test("simultaneous API calls share one refresh request", async () => {
  const delayed = deferred();
  let rotations = 0;
  const { client, stored } = loadClient(async (url) => {
    if (url.endsWith("auth/refresh/")) {
      rotations++;
      return delayed.promise;
    }
    return response(account);
  }, "android");
  stored.set("physiohome.refresh", "refresh-0");
  const first = client.currentAccount();
  const second = client.currentAccount();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rotations, 1);
  delayed.resolve(response(tokens));
  await Promise.all([first, second]);
  assert.equal(rotations, 1);
});

test("a delayed account response cannot restore a logged-out user", async () => {
  const delayed = deferred();
  const changes = [];
  const { client, stored } = loadClient(async (url) => {
    if (url.endsWith("auth/login/")) return response(tokens);
    if (url.endsWith("me/")) return delayed.promise;
    return response(null, 204);
  }, "ios");
  client.subscribeAuth((user) => changes.push(user));
  await client.login("patient@example.com", "password", "patient");
  const oldRequest = client.currentAccount();
  await client.logout();
  delayed.resolve(response(account));
  await oldRequest;
  assert.equal(changes.at(-1), null);
  assert.equal(stored.size, 0);
});

test("failed remote logout retains the local session for a retry", async () => {
  const changes = [];
  const { client, stored } = loadClient(async (url) => {
    if (url.endsWith("auth/login/")) return response(tokens);
    return response({ detail: "Service unavailable" }, 503);
  }, "ios");
  client.subscribeAuth((user) => changes.push(user));
  await client.login("patient@example.com", "password", "patient");
  await assert.rejects(client.logout(), (error) => error.status === 503);
  assert.equal(stored.get("physiohome.refresh"), "refresh-1");
  assert.equal(changes.at(-1).id, account.id);
});
