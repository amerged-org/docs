#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TextEncoder } from "node:util";
import process from "node:process";

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

async function main() {
  const argumentsByName = parseArguments(process.argv.slice(2));
  const inputPath = argumentsByName.get("--input");
  const outputPath = argumentsByName.get("--output");
  const outputDirectory = argumentsByName.get("--output-directory");
  const migrationPrefix = argumentsByName.get("--migration-prefix");
  if (
    inputPath === undefined ||
    (outputPath === undefined) === (outputDirectory === undefined) ||
    (outputDirectory === undefined) !== (migrationPrefix === undefined)
  ) {
    fail("input and one output mode are required");
  }
  const result = createPortableBaseline(await readFile(inputPath, "utf8"), {
    ...(argumentsByName.get("--auth-mode") === undefined
      ? {}
      : { authMode: argumentsByName.get("--auth-mode") }),
    ...(argumentsByName.get("--authorization-mode") === undefined
      ? {}
      : { authorizationMode: argumentsByName.get("--authorization-mode") }),
  });
  let files = [];
  if (outputPath !== undefined) {
    await writeFile(outputPath, result.sql, { encoding: "utf8", mode: 0o600 });
  } else {
    files = splitPortableBaseline(result, migrationPrefix);
    await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
    for (const file of files) {
      await writeFile(resolve(outputDirectory, file.path), file.sql, {
        encoding: "utf8",
        mode: 0o600,
      });
    }
  }
  process.stdout.write(
    `${JSON.stringify({
      version: 1,
      statementCount: result.statements.length,
      omittedPolicyCount: result.omittedPolicyCount,
      convertedAuthReferenceCount: result.convertedAuthReferenceCount,
      files: files.map(({ path, byteLength, statementCount }) => ({
        path,
        byteLength,
        statementCount,
      })),
    })}\n`,
  );
}

export function splitPortableBaseline(baseline, migrationPrefix, maximumBytes = 256 * 1024) {
  if (
    !baseline ||
    !Array.isArray(baseline.statements) ||
    baseline.statements.length === 0 ||
    typeof migrationPrefix !== "string" ||
    !/^\d{14}_[a-z0-9][a-z0-9_-]*$/u.test(migrationPrefix) ||
    !Number.isInteger(maximumBytes) ||
    maximumBytes < 128 ||
    maximumBytes > 256 * 1024
  ) {
    fail("split migration input is invalid");
  }
  const header =
    "-- Portable PostgreSQL baseline generated from a reviewed public-schema dump.\n\n";
  const groups = [];
  let current = [];
  for (const statement of baseline.statements) {
    const candidate = [...current, statement];
    if (utf8Bytes(renderStatements(header, candidate)) <= maximumBytes) {
      current = candidate;
      continue;
    }
    if (current.length === 0) fail("one portable statement exceeds the migration limit");
    groups.push(current);
    current = [statement];
    if (utf8Bytes(renderStatements(header, current)) > maximumBytes) {
      fail("one portable statement exceeds the migration limit");
    }
  }
  if (current.length > 0) groups.push(current);
  if (groups.length > 128) fail("portable baseline exceeds the migration-count limit");
  return Object.freeze(
    groups.map((statements, index) => {
      const sql = renderStatements(header, statements);
      return Object.freeze({
        path: `${migrationPrefix}_${String(index + 1).padStart(3, "0")}.sql`,
        sql,
        byteLength: utf8Bytes(sql),
        statementCount: statements.length,
      });
    }),
  );
}

function renderStatements(header, statements) {
  return `${header}${statements.join(";\n\n")};\n`;
}

function utf8Bytes(value) {
  return new TextEncoder().encode(value).byteLength;
}

export function createPortableBaseline(rawSource, rawOptions = {}) {
  const options = parseOptions(rawOptions);
  const prepared = prepareSource(rawSource, options);
  const source = prepared.source.replace(/^\\(?:un)?restrict [^\n]*\n/gmu, "");
  const statements = splitSqlStatements(source);
  const hasPrivateSchema = statements.some((statement) =>
    /^create schema(?: if not exists)? private$/u.test(normalizeStatement(statement)),
  );
  const output = [
    "CREATE SCHEMA IF NOT EXISTS extensions",
    ...(hasPrivateSchema ? ["CREATE SCHEMA IF NOT EXISTS private"] : []),
    "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions",
    "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions",
    "CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions",
    "SET check_function_bodies = false",
    ...(options.authMode === "better-auth-uuid"
      ? [
          `CREATE FUNCTION public.current_actor_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_actor_id', true), '')::uuid
$$`,
        ]
      : []),
  ];
  const views = new Map();
  let omittedPolicyCount = 0;
  for (const statement of statements) {
    let candidate = statement;
    let normalized = normalizeStatement(candidate);
    if (normalized === "") continue;
    if (options.authorizationMode === "server" && normalized.startsWith("create policy ")) {
      omittedPolicyCount += 1;
      continue;
    }
    if (
      options.authorizationMode === "server" &&
      /^create function public\.is_service_role_request\(\)/u.test(normalized)
    ) {
      candidate = portableServiceRequestFunction();
      normalized = normalizeStatement(candidate);
    }
    if (ignoredStatement(normalized)) continue;
    rejectUnsafeStatement(normalized, options);
    const view = /^create(?: or replace)? view ([a-z0-9_."]+)\b/u.exec(normalized);
    if (view !== null) {
      const name = view[1];
      if (name === undefined) fail("view identity is invalid");
      const previous = views.get(name);
      if (normalized.startsWith("create or replace view ")) {
        if (previous !== undefined) output[previous] = null;
        views.set(name, output.length);
        output.push(candidate.replace(/CREATE OR REPLACE VIEW/u, "CREATE VIEW").trim());
        continue;
      }
      if (previous !== undefined) fail(`duplicate view ${name}`);
      views.set(name, output.length);
    }
    output.push(candidate.trim());
  }
  const canonical = output
    .filter((statement) => statement !== null)
    .map((statement, index) => ({ statement, index, priority: statementPriority(statement) }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map(({ statement }) => statement);
  if (canonical.length === 0) fail("baseline is empty");
  return Object.freeze({
    statements: Object.freeze(canonical),
    omittedPolicyCount,
    convertedAuthReferenceCount: prepared.convertedAuthReferenceCount,
    sql: `-- Portable PostgreSQL baseline generated from a reviewed public-schema dump.\n\n${canonical.join(";\n\n")};\n`,
  });
}

function parseOptions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("options are invalid");
  const keys = Object.keys(value).sort();
  if (keys.some((key) => key !== "authMode" && key !== "authorizationMode")) {
    fail("options are invalid");
  }
  const authMode = value.authMode ?? "reject-provider-auth";
  const authorizationMode = value.authorizationMode ?? "preserve";
  if (
    (authMode !== "reject-provider-auth" && authMode !== "better-auth-uuid") ||
    (authorizationMode !== "preserve" && authorizationMode !== "server") ||
    (authMode === "better-auth-uuid") !== (authorizationMode === "server")
  ) {
    fail("options are invalid");
  }
  return Object.freeze({ authMode, authorizationMode });
}

function prepareSource(rawSource, options) {
  if (typeof rawSource !== "string") fail("source is invalid");
  if (options.authMode !== "better-auth-uuid") {
    return { source: rawSource, convertedAuthReferenceCount: 0 };
  }
  const userReferences = rawSource.match(/\bauth\.users\b/gu)?.length ?? 0;
  const uidReferences = rawSource.match(/\bauth\.uid\(\)/gu)?.length ?? 0;
  return {
    source: rawSource
      .replace(/\bauth\.users\b/gu, 'auth."user"')
      .replace(/\bauth\.uid\(\)/gu, "public.current_actor_id()"),
    convertedAuthReferenceCount: userReferences + uidReferences,
  };
}

function portableServiceRequestFunction() {
  return `CREATE FUNCTION public.is_service_role_request()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user = 'ohmyho_runtime'
    AND current_setting('app.service_request', true) = 'on'
$$`;
}

function statementPriority(statement) {
  const normalized = normalizeStatement(statement);
  if (normalized === "set check_function_bodies = false") return 0;
  if (/^create (?:schema|extension|type|domain|sequence)\b/u.test(normalized)) return 0;
  if (/^create table\b/u.test(normalized)) return 1;
  if (/^create function\b/u.test(normalized)) return 2;
  if (/^alter table\b/u.test(normalized)) return 3;
  if (/^create (?:unique )?index\b/u.test(normalized)) return 4;
  if (/^create (?:materialized )?view\b/u.test(normalized)) return 5;
  if (/^create (?:constraint )?trigger\b/u.test(normalized)) return 6;
  fail(`unsupported portable statement: ${normalized.slice(0, 80)}`);
}

function parseArguments(values) {
  const parsed = new Map();
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];
    if (!/^--[a-z-]+$/u.test(name ?? "") || value === undefined || parsed.has(name)) {
      fail("arguments are invalid");
    }
    parsed.set(name, value);
  }
  return parsed;
}

function ignoredStatement(statement) {
  return (
    statement.startsWith("set ") ||
    statement.startsWith("select pg_catalog.set_config(") ||
    statement === "create schema public" ||
    /^create schema(?: if not exists)? private$/u.test(statement) ||
    /^alter table(?: only)? [a-z0-9_."]+ (?:enable|force) row level security$/u.test(statement)
  );
}

function rejectUnsafeStatement(statement, options) {
  const withoutBetterAuthRelations =
    options.authMode === "better-auth-uuid"
      ? statement.replace(/\bauth\."(?:account|rateLimit|session|user|verification)"/gu, "")
      : statement;
  if (
    statement.startsWith("\\") ||
    /\b(?:auth|storage)\s*\./u.test(withoutBetterAuthRelations) ||
    (options.authMode !== "better-auth-uuid" &&
      /\b(?:anon|authenticated|service_role|supabase)\b/u.test(statement)) ||
    /^(?:create|alter|drop) (?:policy|role|user)\b/u.test(statement) ||
    /^(?:grant|revoke|drop|truncate|delete|update|insert)\b/u.test(statement) ||
    /^alter table(?: only)? [a-z0-9_."]+ (?:disable|no force) row level security$/u.test(statement)
  ) {
    fail(`unsafe statement: ${statement.slice(0, 80)}`);
  }
}

export function splitSqlStatements(sql) {
  const statements = [];
  let start = 0;
  let index = 0;
  while (index < sql.length) {
    const character = sql[index];
    const next = sql[index + 1];
    if (character === "-" && next === "-") {
      index = skipLineComment(sql, index + 2);
      continue;
    }
    if (character === "/" && next === "*") {
      index = skipBlockComment(sql, index + 2);
      continue;
    }
    if (character === "'" || character === '"') {
      index = skipQuoted(sql, index + 1, character);
      continue;
    }
    if (character === "$") {
      const delimiter = dollarDelimiter(sql, index);
      if (delimiter !== null) {
        const end = sql.indexOf(delimiter, index + delimiter.length);
        if (end < 0) fail("unterminated dollar quote");
        index = end + delimiter.length;
        continue;
      }
    }
    if (character === ";") {
      const statement = sql.slice(start, index).trim();
      if (statement.length > 0) statements.push(statement);
      start = index + 1;
    }
    index += 1;
  }
  const tail = sql.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

function skipLineComment(sql, index) {
  const newline = sql.indexOf("\n", index);
  return newline < 0 ? sql.length : newline + 1;
}

function skipBlockComment(sql, index) {
  let depth = 1;
  while (index < sql.length) {
    if (sql[index] === "/" && sql[index + 1] === "*") {
      depth += 1;
      index += 2;
      continue;
    }
    if (sql[index] === "*" && sql[index + 1] === "/") {
      depth -= 1;
      index += 2;
      if (depth === 0) return index;
      continue;
    }
    index += 1;
  }
  fail("unterminated block comment");
}

function skipQuoted(sql, index, quote) {
  while (index < sql.length) {
    if (sql[index] !== quote) {
      index += 1;
      continue;
    }
    if (sql[index + 1] === quote) {
      index += 2;
      continue;
    }
    return index + 1;
  }
  fail("unterminated quote");
}

function dollarDelimiter(sql, index) {
  return /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/u.exec(sql.slice(index))?.[0] ?? null;
}

export function normalizeStatement(statement) {
  return statement
    .replace(/--[^\n]*(?:\n|$)/gu, " ")
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function fail(message) {
  throw new Error(`Portable baseline generation failed: ${message}`);
}
