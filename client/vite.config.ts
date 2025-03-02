import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
  server: {
    https: {
      key: './ssl/key.pem',
      cert: './ssl/cert.pem',
    },
    host: '0.0.0.0',
    port: 5173,
  },
  // server: {
  //   host: '0.0.0.0',
  // },
  // preview: {
  //   allowedHosts: ['cyberslavs.fun']
  // }
})
