/**
 * booking-notify — 신규 예약 시 원장·담당 디자이너에게 Web Push 발송
 *
 * Supabase Database Webhook 으로 트리거:
 *   Table: bookings
 *   Events: INSERT
 *   HTTP Method: POST
 *   URL: https://<project>.supabase.co/functions/v1/booking-notify
 *
 * 환경 변수 (Supabase 대시보드 → Edge Functions → Secrets):
 *   SUPABASE_URL            — 자동 주입
 *   SUPABASE_SERVICE_ROLE_KEY — 자동 주입
 *   VAPID_SUBJECT           — mailto:admin@yourshop.com
 *   VAPID_PUBLIC_KEY        — web-push 생성 키
 *   VAPID_PRIVATE_KEY       — web-push 생성 키
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-expect-error — Deno npm 모듈
import webpush from 'npm:web-push@3.6.7';

interface BookingRecord {
  id:                string;
  shop_id:           string;
  client_name:       string;
  requested_date:    string;
  requested_time:    string;
  preferred_designer?: string;
  service_types:     string[];
}

interface WebhookPayload {
  type:   'INSERT' | 'UPDATE' | 'DELETE';
  table:  string;
  schema: string;
  record: BookingRecord;
}

Deno.serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
      });
    }

    const payload: WebhookPayload = await req.json();
    if (payload.type !== 'INSERT' || payload.table !== 'bookings') {
      return new Response('ignored', { status: 200 });
    }

    const booking = payload.record;

    // VAPID 설정
    const vapidSubject    = Deno.env.get('VAPID_SUBJECT')     ?? 'mailto:admin@hairjjal.com';
    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[booking-notify] VAPID 키 미설정. 알림을 건너뜁니다.');
      return new Response('no vapid', { status: 200 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Supabase Service 클라이언트로 push_subscriptions 조회
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('shop_id', booking.shop_id);

    if (error || !subscriptions?.length) {
      console.log('[booking-notify] 구독 없음:', error?.message);
      return new Response('no subscriptions', { status: 200 });
    }

    // 서비스 타입 한국어 변환
    const SERVICE_KO: Record<string, string> = {
      cut: '커트', color: '염색', bleach: '탈색', perm: '펌',
      straightening: '매직', treatment: '트리트먼트',
      scalp: '두피', styling: '스타일링', other: '기타',
    };
    const servicesStr = booking.service_types
      .map(s => SERVICE_KO[s] ?? s)
      .join(', ');

    const notificationPayload = JSON.stringify({
      title:  '새 예약 신청 🗓',
      body:   `${booking.client_name} · ${booking.requested_date} ${booking.requested_time} · ${servicesStr}`,
      icon:   '/icons/icon-192x192.png',
      badge:  '/icons/badge-72x72.png',
      tag:    `booking-${booking.id}`,
      data:   { bookingId: booking.id, url: '/bookings' },
    });

    // 모든 구독에 발송 (원장 + 담당 디자이너)
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(sub.subscription, notificationPayload)
      )
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[booking-notify] 발송: ${sent}건, 실패: ${failed}건`);

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[booking-notify] 오류:', err);
    return new Response('error', { status: 500 });
  }
});
