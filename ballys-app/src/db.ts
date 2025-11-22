import { neon } from '@netlify/neon';

// Create a SQL query function using the Neon integration for Netlify
// This automatically uses the NETLIFY_DATABASE_URL environment variable
export const sql = neon();

// Helper to check if DB is configured
// In the Netlify Neon integration context, we assume it is configured if the code runs
// or we can check if we can make a query (but that's async).
// For now, we'll return true as neon() returns a client instance.
export const isDbConfigured = () => !!sql;
