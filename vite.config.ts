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
        // 사전 캐시 대상 (앱 셸) — 대형 청크는 제외하고 런타임 캐시로 처리
        globPatterns: ['**/*.{css,html,ico,png,svg,woff,woff2}', '**/index-*.js', '**/vendor-react-*.js'],

        // 대형 청크(recharts 등)는 사전 캐시 제외 → 런타임 캐시로 처리
        globIgnores: ['**/vendor-charts-*.js', '**/OwnerDashboard-*.js', '**/Dashboard-*.js'],

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
            // recharts 청크 — 첫 접근 시 캐시, 이후 즉시 제공
            urlPattern: /vendor-charts-.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chunks-charts',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // 라우트 분리된 JS 청크 (Dashboard, OwnerDashboard, 각 뷰)
            urlPattern: /\/(Dashboard|OwnerDashboard|ClientList|ClientDetail|StaffProfile|BookingList|ConsultationDetail|CustomerLayout|CustomerBooking)-.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chunks-routes',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
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
        manualChunks(id) {
          // recharts + d3 계열 → vendor-charts 청크 (지연 로드)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'vendor-charts';
          }
          // React 코어 → vendor-react 청크
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // date-fns → vendor-datefns 청크
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-datefns';
          }
        },
      },
    },
  },
  }
})
