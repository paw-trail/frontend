import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// 개발 서버는 /api 를 게이트웨이로 넘긴다.
// 브라우저 입장에서 같은 출처가 되어 CORS 가 생기지 않고 HttpOnly 쿠키가 그대로 실린다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  const ingestTarget = env.VITE_INGEST_PROXY_TARGET || 'http://localhost:8088';

  // 관리자 「공사 데이터 최신 수집」 — 게이트웨이에 관리자 입구가 열리기 전까지
  // 개발 서버가 ingest 의 수집 입구(/internal, 호스트 8088)로 바로 넘긴다.
  // 실행은 POST → /internal/ingest/trigger, 기록은 GET → /internal/ingest/runs
  const proxy: Record<string, ProxyOptions> = {
    '/api/v1/admin/ingest/runs': {
      target: ingestTarget,
      changeOrigin: true,
      configure: (p) => {
        p.on('proxyReq', (proxyReq, req) => {
          const query = (req.url ?? '').split('?')[1];
          proxyReq.path = req.method === 'POST' ? '/internal/ingest/trigger' : `/internal/ingest/runs${query ? `?${query}` : ''}`;
        });
      },
    },
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
