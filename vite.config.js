import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  plugins: [vue()],

  server: {
    // allow _any_ Host header (disables DNS-rebind protection)
    allowedHosts: true,
  },
});
