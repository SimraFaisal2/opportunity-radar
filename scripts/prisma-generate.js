// Picks the right Prisma schema at install time based on DATABASE_URL.
//
//   postgresql:// or postgres://  -> prisma/schema.postgres.prisma (Vercel/Neon production)
//   anything else (file:, unset)  -> prisma/schema.prisma (local SQLite dev)
//
// This matters because `prisma generate` validates the datasource URL protocol
// against the schema's provider — on Vercel the postinstall would otherwise try
// to generate a SQLite client while DATABASE_URL points at Postgres and fail
// the build with P1012.
const { execSync } = require("child_process");
const path = require("path");

const url = process.env.DATABASE_URL || "";
const schema = /^postgres(ql)?:\/\//i.test(url)
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

// Resolve the real CLI entry instead of relying on node_modules/.bin being on
// PATH (it is inside `npm install`, but not when the script is run directly).
const prismaCli = require.resolve("prisma/build/index.js", {
  paths: [path.join(__dirname, "..")],
});

console.log(`[prisma] generating client from ${schema}`);
execSync(`node ${prismaCli} generate --schema ${schema}`, { stdio: "inherit" });
