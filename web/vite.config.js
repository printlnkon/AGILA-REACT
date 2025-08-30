import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import browserslist from 'browserslist';
import {browserslistToTargets} from 'lightningcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // css: {
  //   transformer: 'lightningcss',
  //   lightningcss: {
  //     targets: browserslistToTargets(browserslist('>= 0.25%'))
  //   }
  // },
  // build: {
  //   cssMinify: 'lightningcss'
  // },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
})
