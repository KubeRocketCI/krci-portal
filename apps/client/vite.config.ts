import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env.development") });

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@my-project/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    // Redirects requests in vite dev mode "http:/localhost:5173/api" => "http://localhost:3001/api"
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  define: {
    "import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME": JSON.stringify(process.env.SHARED_K8S_DEFAULT_CLUSTER_NAME),
    "import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAMESPACE": JSON.stringify(
      process.env.SHARED_K8S_DEFAULT_CLUSTER_NAMESPACE
    ),
    "import.meta.env.VITE_APP_API_PREFIX": JSON.stringify(process.env.SHARED_APP_API_PREFIX),
  },
});
