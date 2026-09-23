import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// 개발 서버는 /api 를 게이트웨이로 넘긴다.
// 브라우저 입장에서 같은 출처가 되어 CORS 가 생기지 않고 HttpOnly 쿠키가 그대로 실린다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

  const proxy: Record<string, ProxyOptions> = {
    '/api': { target, changeOrigin: false },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: { port: 4173, proxy },
  };
});
