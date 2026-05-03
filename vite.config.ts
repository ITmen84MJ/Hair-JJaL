import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 저장소 이름과 동일하게 base 경로 설정
// 개발 서버(preview 포함)에서는 루트(/)로 서빙하고 빌드 시에만 /Hair-JJaL/ 적용
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const base = isProd ? '/Hair-JJaL/' : '/';

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // 새 버전 배포 시 자동 업데이트
      injectRegister: 'script', // 외부 .js 파일로 SW 등록 → CSP script-src에 'unsafe-inline' 불필요

      // manifest.json은 public/에 직접 관리 (manifest: false)
      manifest: false,

      workbox: {
        // 사전 캐시 대상 (앱 셸)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // SPA 네비게이션 fallback — 모든 탐색 요청을 index.html로
        navigateFallback: isProd ? '/Hair-JJaL/index.html' : '/index.html',

        // share 링크 등 query string 포함 URL, 매뉴얼 HTML은 SW가 가로채지 않음
        navigateFallbackDenylist: isProd
          ? [/^\/Hair-JJaL\/api\//, /^\/Hair-JJaL\/manuals\//]
          : [/^\/api\//, /^\/manuals\//],

        // offline.html을 명시적으로 사전 캐시에 포함
        additionalManifestEntries: [
          { url: isProd ? '/Hair-JJaL/offline.html' : '/offline.html', revision: '1' },
        ],

        // 런타임 캐싱 전략
        runtimeCaching: [
          {
            // 앱 내 이미지 (before/after 사진 등)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
              },
            },
          },
        ],
      },
    }),
  ],
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // recharts + d3 계열을 별도 청크로 분리 — 초기 번들에서 제외
          'vendor-charts': ['recharts'],
          // React 코어 라이브러리
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
  }
})
