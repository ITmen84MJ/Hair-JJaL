import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 저장소 이름과 동일하게 base 경로 설정
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // 새 버전 배포 시 자동 업데이트
      injectRegister: 'auto',

      // manifest.json은 public/에 직접 관리 (manifest: false)
      manifest: false,

      workbox: {
        // 사전 캐시 대상 (앱 셸)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // SPA 네비게이션 fallback — 모든 탐색 요청을 index.html로
        navigateFallback: '/Hair-JJaL/index.html',

        // share 링크 등 query string 포함 URL도 정상 처리
        navigateFallbackDenylist: [/^\/Hair-JJaL\/api\//],

        // offline.html을 명시적으로 사전 캐시에 포함
        additionalManifestEntries: [
          { url: '/Hair-JJaL/offline.html', revision: '1' },
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
  base: '/Hair-JJaL/',
})
