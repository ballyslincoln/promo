import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Shim for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser since dotenv might not be installed
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log("Loaded environment variables from .env");
    }
  } catch (e) {
    console.warn("Could not load .env file:", e);
  }
}

loadEnv();

const dbUrl = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Error: VITE_DATABASE_URL or DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
  try {
    const schemaPath = path.resolve(__dirname, '../schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split commands roughly by semicolon to ensure execution if driver has issues with bulk
    // However, simple splitting might break if semicolons are in strings. 
    // For this schema file, it looks safe as it only has CREATE TABLE statements.
    const commands = schemaSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    console.log(`Found ${commands.length} commands to execute.`);

    for (const command of commands) {
      // console.log("Executing:", command.substring(0, 50) + "...");
      try {
        await sql(command); // specific implementation might change, reverting to basic execution
      } catch (err) {
        // Fallback for newer neon driver versions that enforce tagged template usage
        // We construct a fake TemplateStringsArray-like object or just pass array
        await sql([command]);
      }
    }

    console.log("Schema applied successfully.");

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Verified tables in DB:", tables.map(t => t.table_name).join(', '));

  } catch (err) {
    console.error("Error applying schema:", err);
    process.exit(1);
  }
}

run();
