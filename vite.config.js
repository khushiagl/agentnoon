import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // allow _any_ Host header (disables DNS-rebind protection)
    allowedHosts: true,
  },
});
