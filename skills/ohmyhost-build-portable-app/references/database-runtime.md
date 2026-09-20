# Calling the ohmyho.st database from your application

The binding is `OHMYHOST_DATABASE`. Use the client from `@ohmyhost/customer-runtime`; it is the
only supported way in, and `ohmyhost init` lists the package for every database project.

```ts
import { createPrivateDatabaseClient } from "@ohmyhost/customer-runtime/database";

export default {
  async fetch(request: Request, env: { OHMYHOST_DATABASE: unknown }) {
    const database = createPrivateDatabaseClient(env.OHMYHOST_DATABASE);
    const { rows } = await database.query({
      text: "SELECT $1::int AS ready",
      values: [1],
    });
    return Response.json(rows);
  },
};
```

Several statements that are decided before the first result arrives go in one transaction:

```ts
const results = await database.transaction([
  { text: "INSERT INTO notes(body) VALUES($1)", values: ["first"] },
  { text: "INSERT INTO notes(body) VALUES($1)", values: ["second"] },
]);
```

For JSON/JSONB object parameters, use customer-runtime **0.1.7 or newer** and pass ordinary
JavaScript objects, including nested objects and arrays:

```ts
const { rows } = await database.query({
  text: "SELECT $1::jsonb AS settings",
  values: [{ notifications: { channels: ["email"] } }],
});
```

The client validates keys and size, then creates RPC-compatible plain objects. Version 0.1.6
created null-prototype objects that Workers RPC rejected. Upgrade the pinned runtime URL and
lockfile when repairing that failure; keep the application's ordinary JSON parameter contract.
When an app stores JSON, verify an actual JSON write/read through its hosted route as well as
its health query. A scalar-only health query does not exercise object serialization.

## What you cannot do, and why

- **No connection string, no `pg`, no Hyperdrive.** A customer Worker never receives a database URL
  and cannot open a socket: outbound `connect()` is disabled. Reading `HYPERDRIVE.connectionString`
  or constructing a `pg` `Pool` builds green, deploys, and then fails its health check with nothing
  to show for it.
- **Interactive transactions are bounded.** Use `database.withConnection(callback)` for read-decide-write
  flows, sending `BEGIN`, your parameterized statements and `COMMIT` or `ROLLBACK` through the
  callback's `connection.query({ text, values })`; the client closes the connection in `finally`.
  Limits are two active database transactions per project environment, 100 statements, 30 seconds
  total and five seconds idle; closing rolls back an uncommitted transaction. Standalone statements
  commit before their response; use explicit `BEGIN` and `COMMIT` when several calls must be atomic.
  Transaction-local timeouts release database slots even if the callback stops making requests.
- **Keep provider work outside that scope.** Finish a small database claim, close its connection,
  transfer/process the bounded file or call the provider, then open a fresh short transaction to
  persist the outcome. Waiting for an upload or AI response consumes the connection's idle lease.
- **Keep calendar days as calendar days.** SQL `DATE` returns a `YYYY-MM-DD` string, without a
  timezone conversion. Timestamp values keep their existing decoding; do not convert every date
  field to midnight or slice an arbitrary timestamp to repair an application type mismatch.
- **Handle database conflicts by SQLSTATE.** A verified statement failure exposes its five-character
  PostgreSQL code on `error.code`, such as `23505` for a duplicate or `23P01` for an exclusion conflict.
  SQL text, row values and provider messages are not returned. Only serialization failure `40001`
  and deadlock `40P01` are marked retryable; retry the whole transaction within a bound. Transport
  failures remain `database_unavailable` and must not be mistaken for a rejected business action.
- **Never detect the platform by probing a method.** A Workers service binding is a proxy, so
  `typeof binding.anything === "function"` is true for every name, including methods the receiver
  does not implement. The call then fails at runtime with an unimplemented-method error. Detect the
  platform by the presence of `OHMYHOST_PROJECT_ID`, or by your own capability flag.

## What it costs

The database sleeps when idle and bills by active compute. A query wakes it. Do not add a periodic
health query that keeps it awake; it turns an idle project into a billed one.
