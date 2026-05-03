# Hair JJaL — 보안 정책 문서

OWASP Top 10 2021 · OWASP MASVS v2 기준으로 적용된 보안 설정을 기록합니다.

---

## 1. Content Security Policy (CSP)

### 적용 위치
| 환경 | 방식 | 파일 |
|------|------|------|
| GitHub Pages | `<meta http-equiv="Content-Security-Policy">` | `index.html` |
| Netlify | HTTP 응답 헤더 | `netlify.toml` |
| Vercel | HTTP 응답 헤더 | `vercel.json` |

> GitHub Pages는 HTTP 헤더 직접 제어 불가 → `<meta>` 태그로 대체.  
> `frame-ancestors` · HSTS는 HTTP 헤더 전용이므로 Netlify/Vercel에서만 완전 적용.

### 현재 정책

```
default-src 'self'
```
기본적으로 동일 출처 리소스만 허용.

```
script-src 'self'
```
인라인 스크립트 완전 차단. PWA 서비스워커는 `registerSW.js` 외부 파일로 주입  
(`injectRegister: 'script'` — `vite.config.ts`).

```
style-src 'self' 'unsafe-inline'
```
React `style={{ }}` 인라인 속성으로 인해 `'unsafe-inline'` 불가피.  
향후 CSS Module 또는 CSS 변수만 사용하는 방식으로 전환 시 제거 가능.

```
img-src 'self' data: blob:
```
localStorage에 저장된 base64 사진(`data:`), Blob URL(`blob:`) 허용.  
Sprint 3에서 Supabase Storage로 이전 후 `data:` 제거 예정.

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```
Sprint 3 Supabase 백엔드 도입 대비 사전 허용. 현재는 `'self'`만 사용.

```
worker-src 'self' blob:
```
PWA 서비스워커(Workbox) 실행 허용.

```
object-src 'none'
```
Flash · ActiveX · 플러그인 완전 차단.

```
base-uri 'self'
```
`<base href>` 하이재킹 공격 방지.

```
form-action 'self'
```
폼 제출 후 외부 사이트로 피싱 redirect 차단.

```
upgrade-insecure-requests
```
HTTP 리소스 참조를 자동으로 HTTPS로 업그레이드.

### meta 태그로 적용 불가한 지시어 (Netlify/Vercel에서만 동작)
| 지시어 | 역할 |
|--------|------|
| `frame-ancestors 'none'` | 클릭재킹 방지 (iframe 삽입 차단) |

---

## 2. HTTP 보안 헤더 (Netlify · Vercel)

| 헤더 | 값 | OWASP/MASVS 매핑 |
|------|----|------------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | MASVS-NETWORK-1 |
| `X-Frame-Options` | `DENY` | A03 (클릭재킹) |
| `X-Content-Type-Options` | `nosniff` | MASVS-NETWORK-1 |
| `X-XSS-Protection` | `1; mode=block` | A03 (구형 브라우저) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 정보 노출 방지 |
| `Permissions-Policy` | `camera=(), microphone=(self), ...` | MASVS-PLATFORM |
| `Cross-Origin-Opener-Policy` | `same-origin` | Spectre 완화 |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Spectre 완화 |
| `Cross-Origin-Resource-Policy` | `same-origin` | Spectre 완화 |

> GitHub Pages의 `itmen84mj.github.io` 도메인은 GitHub의 HSTS preload 설정으로  
> 이미 HTTPS가 강제되므로 HSTS 헤더 없이도 다운그레이드 공격 방어 가능.

---

## 3. 인증·세션 보안 (`src/hooks/useAuth.ts`)

| 항목 | 구현 내용 |
|------|-----------|
| 비밀번호 저장 | SHA-256 (Web Crypto API) + 이메일 솔팅 |
| 세션 만료 | 8시간 (`loginAt` 기록 → 로드 시 체크) |
| 브루트포스 방어 | 5회 실패 → 15분 잠금 (sessionStorage) |
| 데모 원클릭 로그인 | `import.meta.env.DEV` 조건부 — 프로덕션 빌드 제외 |
| 세션 저장 | 비밀번호·해시 필드 제외 후 localStorage 저장 |

---

## 4. 데이터 보호

| 항목 | 상태 |
|------|------|
| PII 내보내기(CSV/JSON) | 제거됨 (MASVS-STORAGE-1) |
| 이미지 저장 | 현재 localStorage base64 → Sprint 3 Supabase Storage 이전 예정 |
| 데이터 암호화 | 미적용 (localStorage 평문) → Sprint 3 서버 사이드 암호화 예정 |
| dangerouslySetInnerHTML | 제거됨 (MASVS-CODE-2) |

---

## 5. 잔여 위험 및 Sprint 로드맵

| 위험 | 현재 | 해결 Sprint |
|------|------|-------------|
| localStorage 평문 PII | 🔴 고객 이름·전화 미암호화 | Sprint 3 (Supabase DB) |
| 클라이언트 전용 접근 제어 | 🔴 서버 검증 없음 | Sprint 3 (RLS) |
| 감사 로그 없음 | 🟠 로그인·데이터 조회 기록 없음 | Sprint 4 |
| style-src unsafe-inline | 🟡 CSS injection 위험 낮음 | Sprint 4 (CSS Module 전환 시) |
