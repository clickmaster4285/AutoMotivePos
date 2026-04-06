import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Fallback to localhost if the env variable is not set
  const proxyTarget = env.VITE_PROXY_TARGET;

  return {
    server: {
      host: "::",
      port: (() => {
        const p = Number(env.VITE_PORT);
        return Number.isFinite(p) && p > 0 ? p : 8080;
      })(),
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false, // Add this for local development
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url, '->', proxyTarget + req.url);
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});