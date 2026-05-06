import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  // Permite que Rollup processe arquivos CJS locais (packages/shared)
  build: {
    commonjsOptions: {
      include: [/packages\/shared\/.*/, /node_modules\/.*/],
    },
  },
});
