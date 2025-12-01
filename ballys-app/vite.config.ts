import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose NETLIFY_DATABASE_URL to the client as VITE_DATABASE_URL
  define: {
    'import.meta.env.VITE_DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.VITE_DATABASE_URL)
  }
})
