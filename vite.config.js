import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // React 플러그인은 JSX/React Refresh 처리를 담당합니다.
  plugins: [react()],
  server: {
    // 로컬 미리보기 기준 포트입니다. 충돌 시 vite가 다른 포트 사용 여부를 안내합니다.
    port: 5173,
  },
});
