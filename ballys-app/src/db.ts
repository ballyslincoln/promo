import { neon } from '@neondatabase/serverless';

// Create a SQL query function using the Neon serverless driver
// We check if the connection string exists to avoid errors during build or if not configured
// Note: In Vite, we use import.meta.env.VITE_DATABASE_URL
const dbUrl = import.meta.env.VITE_DATABASE_URL;

export const sql = dbUrl ? neon(dbUrl) : null;

// Helper to check if DB is configured
export const isDbConfigured = () => !!sql;
