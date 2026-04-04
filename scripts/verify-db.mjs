import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// Check search path and current schema
const [sp] = await sql`SHOW search_path`;
const [ns] = await sql`SELECT current_schema()`;
console.log('search_path:', sp.search_path);
console.log('current_schema:', ns.current_schema);

// List ALL tables across all schemas
const all = await sql`
  SELECT schemaname, tablename
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog','information_schema')
  ORDER BY schemaname, tablename
`;

if (all.length === 0) {
  console.log('\n⚠️  No user tables found at all.');
} else {
  console.log(`\n✅  Found ${all.length} tables:`);
  all.forEach(({ schemaname, tablename }) => console.log(`  ${schemaname}.${tablename}`));
}
