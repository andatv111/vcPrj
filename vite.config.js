import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // React 플러그인은 JSX/React Refresh 처리를 담당합니다.
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    // 로컬 미리보기 기준 포트입니다. 충돌 시 vite가 다른 포트 사용 여부를 안내합니다.
    port: 5173,
    // 중복 Vite가 5174 등으로 자동 실행되면 사용자가 다른 서버를 보게 되므로 즉시 실패시킵니다.
    strictPort: true,
    proxy: {
      // React saga calls /api/vc/sim/...; Vite forwards those calls to Spring Boot during local development.
      "/api": {
        target: "http://localhost:8090",
        changeOrigin: true,
      },
    },
  },
});
