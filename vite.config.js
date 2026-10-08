import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Connect via the literal loopback IP - Windows doesn't reliably
// resolve arbitrary "*.localhost" subdomains the way
// browsers/macOS/Linux do, which can make Node's proxy fail to even
// reach the backend (a 502 with no body).
const proxyOptions = {
  target: 'http://127.0.0.1:8000',
  changeOrigin: false,
  // Frappe routes by Host header to pick the site, so tell it
  // explicitly which site to serve even though we connected via IP.
  headers: {
    host: 'weconnect.localhost:8000',
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // '/api' - every whitelisted method call (auth, tickets...).
      // '/private' and '/files' - real uploaded Ticket Attachments,
      // served by Frappe with a session-permission check, so they
      // need to go to Frappe too instead of 404ing against Vite.
      '/api': proxyOptions,
      '/private': proxyOptions,
      '/files': proxyOptions,
    },
  },
})