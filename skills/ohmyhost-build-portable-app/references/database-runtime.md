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

## What you cannot do, and why

- **No connection string, no `pg`, no Hyperdrive.** A customer Worker never receives a database URL
  and cannot open a socket: outbound `connect()` is disabled. Reading `HYPERDRIVE.connectionString`
  or constructing a `pg` `Pool` builds green, deploys, and then fails its health check with nothing
  to show for it.
- **Interactive transactions are bounded.** Use `database.withConnection(callback)` for read-decide-write
  flows, sending `BEGIN`, your parameterized statements and `COMMIT` or `ROLLBACK` through the
  callback's `connection.query({ text, values })`; the client closes the connection in `finally`.
  Limits are two held connections per project environment, 100 statements, 30 seconds total and
  five seconds idle; closing rolls back an uncommitted transaction.
- **Never detect the platform by probing a method.** A Workers service binding is a proxy, so
  `typeof binding.anything === "function"` is true for every name, including methods the receiver
  does not implement. The call then fails at runtime with an unimplemented-method error. Detect the
  platform by the presence of `OHMYHOST_PROJECT_ID`, or by your own capability flag.

## What it costs

The database sleeps when idle and bills by active compute. A query wakes it. Do not add a periodic
health query that keeps it awake; it turns an idle project into a billed one.
