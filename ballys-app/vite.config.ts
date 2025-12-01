import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // Expose NETLIFY_DATABASE_URL to the client as VITE_DATABASE_URL
  define: {
    'import.meta.env.VITE_DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.VITE_DATABASE_URL || "postgresql://neondb_owner:npg_3IOi0CKjqomx@ep-dry-boat-aeb1v1gd-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"),
    'import.meta.env.VITE_NEON_DATA_API_URL': JSON.stringify("https://ep-dry-boat-aeb1v1gd.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1")
  }
})
