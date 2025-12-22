import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() to avoid TS error with Process type missing cwd
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Vital: This replaces 'process.env.API_KEY' with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})