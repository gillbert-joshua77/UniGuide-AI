import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // This allows ngrok to bypass the security check
    allowedHosts: 'all' 
  }
})