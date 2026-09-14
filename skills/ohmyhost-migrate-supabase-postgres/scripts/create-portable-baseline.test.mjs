import assert from "node:assert/strict";
import test from "node:test";

import { createPortableBaseline, splitPortableBaseline } from "./create-portable-baseline.mjs";

test("default conversion rejects Supabase Auth and RLS policy dependencies", () => {
  const source = [
    "CREATE TABLE public.profiles (id uuid REFERENCES auth.users(id));",
    "CREATE POLICY own_profile ON public.profiles USING (id = auth.uid());",
  ].join("\n");

  assert.throws(
    () => createPortableBaseline(source),
    /Portable baseline generation failed: unsafe statement/u,
  );
});

test("explicit Better Auth/server authorization mode converts exact identity references and reports omitted policies", () => {
  const source = [
    "CREATE SCHEMA private;",
    "CREATE TABLE public.profiles (id uuid REFERENCES auth.users(id));",
    "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY own_profile ON public.profiles USING (id = auth.uid());",
    "CREATE FUNCTION public.profile_owner() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT auth.uid() $$;",
    "CREATE FUNCTION public.is_service_role_request() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT current_user = 'service_role' $$;",
    "CREATE CONSTRAINT TRIGGER profile_guard AFTER INSERT ON public.profiles DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.profile_owner();",
  ].join("\n");

  const result = createPortableBaseline(source, {
    authMode: "better-auth-uuid",
    authorizationMode: "server",
  });

  assert.equal(result.omittedPolicyCount, 1);
  assert.equal(result.convertedAuthReferenceCount, 3);
  assert.match(result.sql, /REFERENCES auth\."user"\(id\)/u);
  assert.match(result.sql, /CREATE SCHEMA IF NOT EXISTS private/u);
  assert.match(result.sql, /public\.current_actor_id\(\)/u);
  assert.match(result.sql, /current_user = 'ohmyho_runtime'/u);
  assert.match(result.sql, /current_setting\('app\.service_request', true\) = 'on'/u);
  assert.match(result.sql, /SET check_function_bodies = false/u);
  assert.match(result.sql, /CREATE CONSTRAINT TRIGGER profile_guard/u);
  assert.doesNotMatch(result.sql, /auth\.users|auth\.uid|CREATE POLICY|ROW LEVEL SECURITY/u);
});

test("conversion still rejects other Auth schemas, Storage, role DDL, writes, and destructive statements", () => {
  for (const statement of [
    "CREATE TABLE public.bad (id uuid REFERENCES auth.sessions(id));",
    "CREATE TABLE public.bad (id uuid REFERENCES storage.objects(id));",
    "CREATE ROLE attacker;",
    "INSERT INTO public.bad VALUES (1);",
    "DROP TABLE public.bad;",
  ]) {
    assert.throws(
      () =>
        createPortableBaseline(statement, {
          authMode: "better-auth-uuid",
          authorizationMode: "server",
        }),
      /Portable baseline generation failed/u,
    );
  }
});

test("splits canonical statements into ordered admission-sized migration files", () => {
  const baseline = createPortableBaseline(
    Array.from(
      { length: 8 },
      (_, index) => `CREATE TABLE public.table_${index} (id uuid primary key)`,
    ).join(";\n"),
  );
  const files = splitPortableBaseline(baseline, "20260823000000_portable_baseline", 240);

  assert.ok(files.length > 1);
  assert.deepEqual(
    files.map(({ path }) => path),
    files.map(
      (_, index) => `20260823000000_portable_baseline_${String(index + 1).padStart(3, "0")}.sql`,
    ),
  );
  assert.equal(
    files.reduce((sum, file) => sum + file.statementCount, 0),
    baseline.statements.length,
  );
  assert.ok(files.every(({ byteLength }) => byteLength <= 240));
  assert.throws(
    () => splitPortableBaseline(baseline, "../invalid", 240),
    /split migration input is invalid/u,
  );
});
