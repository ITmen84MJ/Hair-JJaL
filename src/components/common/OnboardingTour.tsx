/**
 * 온보딩 투어 (4-5)
 * - 첫 로그인 시 역할별 3~4단계 안내
 * - localStorage 플래그로 1회만 표시
 */
import { useState } from 'react';
import { UserRole } from '../../types';

interface Step { icon: string; title: string; description: string; }

const STEPS: Record<UserRole, Step[]> = {
  owner: [
    { icon: '🏪', title: '지점 설정',    description: '직원 관리 → 지점 정보에서 영업시간, 주소, 연락처를 설정하세요.' },
    { icon: '✂️', title: '디자이너 추가', description: '직원 관리에서 디자이너를 추가하고 로그인 계정을 바로 만들 수 있습니다.' },
    { icon: '📊', title: '통계 확인',    description: '기간별 매출, 인기 시술, 디자이너별 실적을 한눈에 볼 수 있어요.' },
    { icon: '💾', title: '데이터 백업',  description: '내 정보 → 데이터 내보내기로 정기적으로 백업해 두세요.' },
  ],
  designer: [
    { icon: '📋', title: '고객 관리',  description: '고객 목록에서 고객을 추가하고 시술 이력을 관리하세요.' },
    { icon: '📝', title: '상담 기록',  description: '고객 상세 → 새 상담에서 시술 내용과 사진을 기록하세요.' },
    { icon: '📅', title: '예약 확인',  description: '예약 관리에서 신규 예약을 확인하고 확정 또는 취소하세요.' },
    { icon: '👤', title: '내 프로필', description: '내 정보에서 전문 시술, 한 줄 소개, 근무 요일을 업데이트하세요.' },
  ],
  customer: [
    { icon: '📅', title: '예약하기',    description: '홈 화면에서 예약 신청 버튼으로 간편하게 예약할 수 있어요.' },
    { icon: '📖', title: '시술 이력',   description: '지난 시술 이력과 컬러 포뮬러를 언제든 확인할 수 있어요.' },
    { icon: '🔄', title: '다음 방문 예약', description: '시술 상세에서 디자이너가 추천한 날짜로 바로 예약하세요.' },
  ],
};

const FLAG_KEY = 'hairjjal_onboarding_done';

export function OnboardingTour({ role }: { role: UserRole }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => {
    try {
      const done: Record<string, boolean> = JSON.parse(localStorage.getItem(FLAG_KEY) ?? '{}');
      return !done[role];
    } catch { return true; }
  });

  if (!visible) return null;

  const steps = STEPS[role] ?? [];
  const current = steps[step];
  if (!current) return null;

  const dismiss = () => {
    try {
      const done: Record<string, boolean> = JSON.parse(localStorage.getItem(FLAG_KEY) ?? '{}');
      done[role] = true;
      localStorage.setItem(FLAG_KEY, JSON.stringify(done));
    } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Step content */}
        <div className="text-center space-y-2 py-2">
          <div className="text-4xl leading-none">{current.icon}</div>
          <h2 className="text-xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{current.title}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{current.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 20 : 8, height: 8,
                backgroundColor: i === step ? '#f43f5e' : 'var(--bg-muted)',
              }} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            건너뛰기
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">
              다음 →
            </button>
          ) : (
            <button onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">
              시작하기 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
