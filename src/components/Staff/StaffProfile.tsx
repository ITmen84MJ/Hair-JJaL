import { useState } from 'react';
import {
  Mail, Phone, Calendar, Building2, Edit2, Check, X,
  Users, FileText, TrendingUp, Crown, Scissors, User,
  HardDrive, BookOpen, CalendarDays, Plus, Trash2, KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { getStorageUsage } from '../../utils/backup';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AuthUser, Designer, Shop, Consultation, Booking, ROLE_LABELS } from '../../types';

interface Props {
  user: AuthUser;
  designer: Designer | null;       // 본인의 Designer 레코드
  shop: Shop | null;
  myConsultations: Consultation[]; // 본인 담당 시술 이력
  shopConsultations: Consultation[];
  shopClients: import('../../types').Client[];
  shopDesigners: Designer[];
  shopBookings: Booking[];
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
  onUpdateShop?: (data: Partial<Shop>) => void;   // owner only
  onUpdateName?: (name: string) => void;           // 세션 이름 동기화
  onChangePassword?: (newPassword: string) => Promise<string | null>;
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  borderColor: 'var(--border)',
  boxShadow: 'var(--shadow)',
};

const inp = "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all";

export function StaffProfile({
  user, designer, shop,
  myConsultations, shopConsultations, shopClients, shopDesigners, shopBookings,
  onUpdateDesigner, onUpdateShop, onUpdateName, onChangePassword,
}: Props) {
  const isOwner = user.role === 'owner';

  /* ── 편집 상태 ─ 개인 정보 ── */
  const [editing, setEditing] = useState(false);
  const [draftName,  setDraftName]  = useState(user.name);
  const [draftPhone, setDraftPhone] = useState(designer?.phone ?? '');
  const [draftEmail, setDraftEmail] = useState(designer?.email ?? user.email);

  /* ── 편집 상태 ─ 지점 정보 (owner) ── */
  const [editShop, setEditShop] = useState(false);
  const [shopName,    setShopName]    = useState(shop?.name    ?? '');
  const [shopAddress, setShopAddress] = useState(shop?.address ?? '');
  const [shopPhone,   setShopPhone]   = useState(shop?.phone   ?? '');

  /* ── 통계 ── */
  const thisMonthStart = startOfMonth(new Date()).toISOString().slice(0, 10);
  const myClientCount  = new Set(myConsultations.map(c => c.clientId)).size;
  const myTotal        = myConsultations.length;
  const myThisMonth    = myConsultations.filter(c => c.date >= thisMonthStart).length;

  const activeDesigners = shopDesigners.filter(d => d.status === 'active').length;
  const shopClientCount = new Set(shopConsultations.map(c => c.clientId)).size;
  const shopThisMonth   = shopConsultations.filter(c => c.date >= thisMonthStart).length;
  const pendingCount    = shopBookings.filter(b => b.status === 'pending').length;

  /* ── 저장 ── */
  const saveProfile = () => {
    const trimmedName = draftName.trim();
    if (designer) {
      onUpdateDesigner(designer.id, {
        name: trimmedName || designer.name,
        phone: draftPhone,
        email: draftEmail,
      });
    }
    if (trimmedName && trimmedName !== user.name) {
      onUpdateName?.(trimmedName);
    }
    setEditing(false);
  };
  const cancelProfile = () => {
    setDraftName(user.name);
    setDraftPhone(designer?.phone ?? '');
    setDraftEmail(designer?.email ?? user.email);
    setEditing(false);
  };

  const saveShop = () => {
    onUpdateShop?.({ name: shopName, address: shopAddress, phone: shopPhone });
    setEditShop(false);
  };
  const cancelShop = () => {
    setShopName(shop?.name ?? '');
    setShopAddress(shop?.address ?? '');
    setShopPhone(shop?.phone ?? '');
    setEditShop(false);
  };

  /* ── 근무 스케줄 ── */
  const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
  const [editSchedule, setEditSchedule] = useState(false);
  const [draftWorkDays, setDraftWorkDays] = useState<number[]>(
    designer?.workDays ?? [0, 1, 2, 3, 4, 5, 6]
  );
  const [draftDayOff, setDraftDayOff] = useState<string[]>(
    designer?.dayOff ?? []
  );
  const [newDayOff, setNewDayOff] = useState('');

  const toggleDow = (d: number) =>
    setDraftWorkDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );

  const addDayOff = () => {
    if (!newDayOff) return;
    if (!draftDayOff.includes(newDayOff)) {
      setDraftDayOff(prev => [...prev, newDayOff].sort());
    }
    setNewDayOff('');
  };

  const removeDayOff = (date: string) =>
    setDraftDayOff(prev => prev.filter(d => d !== date));

  const saveSchedule = () => {
    if (designer) {
      onUpdateDesigner(designer.id, {
        workDays: draftWorkDays,
        dayOff: draftDayOff,
      });
    }
    setEditSchedule(false);
  };

  const cancelSchedule = () => {
    setDraftWorkDays(designer?.workDays ?? [0, 1, 2, 3, 4, 5, 6]);
    setDraftDayOff(designer?.dayOff ?? []);
    setNewDayOff('');
    setEditSchedule(false);
  };

  /* ── 저장공간 사용량 ── */
  const { usedMB, percent } = getStorageUsage();

  /* ── 역할 색 ── */
  const roleBadgeStyle: React.CSSProperties = isOwner
    ? { backgroundColor: 'var(--role-owner-bg)',    color: 'var(--role-owner-text)' }
    : { backgroundColor: 'var(--role-designer-bg)', color: 'var(--role-designer-text)' };

  const joinedStr = designer?.joinedAt
    ? format(parseISO(designer.joinedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">

      {/* ── 프로필 헤더 ── */}
      <div className="rounded-2xl border p-5 flex items-center gap-4" style={card}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-black text-white"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #fb923c)' }}>
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={roleBadgeStyle}>
              {ROLE_LABELS[user.role]}
            </span>
            {designer?.status === 'active' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: 'var(--bg-success)', color: 'var(--text-success)' }}>
                재직중
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Building2 size={13} />
            {shop?.name ?? '지점 미지정'}
          </p>
          {joinedStr && (
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={12} />
              {joinedStr} 입사
            </p>
          )}
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      {isOwner ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '재직 디자이너', value: activeDesigners, Icon: Scissors, color: 'var(--role-designer-text)' },
            { label: '총 고객 수',    value: shopClientCount, Icon: Users,    color: '#6366f1' },
            { label: '총 시술 건',    value: shopConsultations.length, Icon: FileText, color: '#0ea5e9' },
            { label: '이번달 시술',   value: shopThisMonth,   Icon: TrendingUp, color: 'var(--text-success)' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-xl border p-3 text-center" style={card}>
              <Icon size={18} style={{ color }} className="mx-auto mb-1" />
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '담당 고객',   value: myClientCount, Icon: Users,     color: '#6366f1' },
            { label: '총 시술 건',  value: myTotal,       Icon: FileText,  color: '#0ea5e9' },
            { label: '이번달 시술', value: myThisMonth,   Icon: TrendingUp,color: 'var(--text-success)' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-xl border p-3 text-center" style={card}>
              <Icon size={18} style={{ color }} className="mx-auto mb-1" />
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 개인 정보 ── */}
      <div className="rounded-2xl border p-5 space-y-4" style={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>개인 정보</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
              <Edit2 size={12} /> 수정
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={saveProfile}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors">
                <Check size={12} /> 저장
              </button>
              <button onClick={cancelProfile}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
                <X size={12} /> 취소
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* 이름 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-hover)' }}>
              <User size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>이름</p>
              {editing ? (
                <input value={draftName} onChange={e => setDraftName(e.target.value)}
                  placeholder="이름"
                  className={inp}
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              )}
            </div>
          </div>

          {/* 이메일 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-hover)' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>이메일</p>
              {editing ? (
                <input value={draftEmail} onChange={e => setDraftEmail(e.target.value)}
                  className={inp}
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {designer?.email ?? user.email}
                </p>
              )}
            </div>
          </div>

          {/* 전화번호 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-hover)' }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>전화번호</p>
              {editing ? (
                <input value={draftPhone} onChange={e => setDraftPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className={inp}
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              ) : (
                <p className="text-sm font-medium" style={{ color: designer?.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {designer?.phone ?? '미등록'}
                </p>
              )}
            </div>
          </div>

          {/* 입사일 */}
          {designer?.joinedAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-hover)' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>입사일</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {format(parseISO(designer.joinedAt), 'yyyy년 M월 d일', { locale: ko })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 지점 정보 (owner only) ── */}
      {isOwner && (
        <div className="rounded-2xl border p-5 space-y-4" style={card}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Crown size={14} style={{ color: 'var(--role-owner-text)' }} />
              지점 정보
            </h3>
            {!editShop ? (
              <button onClick={() => setEditShop(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
                <Edit2 size={12} /> 수정
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={saveShop}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors">
                  <Check size={12} /> 저장
                </button>
                <button onClick={cancelShop}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
                  <X size={12} /> 취소
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {[
              { label: '지점명',   value: shopName,    setter: setShopName,    placeholder: '지점 이름' },
              { label: '주소',     value: shopAddress, setter: setShopAddress, placeholder: '지점 주소' },
              { label: '대표 전화',value: shopPhone,   setter: setShopPhone,   placeholder: '02-0000-0000' },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                {editShop ? (
                  <input value={value} onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    className={inp}
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                ) : (
                  <p className="text-sm font-medium" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {value || '미등록'}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 예약 대기 배지 */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
              style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)', border: '1px solid' }}>
              <span style={{ color: 'var(--text-warning)' }}>
                대기중인 예약이 <strong>{pendingCount}건</strong> 있습니다.
              </span>
            </div>
          )}
        </div>
      )}
      {/* ── 근무 스케줄 ── */}
      {designer && (
        <div className="rounded-2xl border p-5 space-y-4" style={card}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <CalendarDays size={14} style={{ color: '#6366f1' }} />
              근무 스케줄
            </h3>
            {!editSchedule ? (
              <button onClick={() => setEditSchedule(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}
                aria-label="근무 스케줄 수정">
                <Edit2 size={12} /> 수정
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={saveSchedule}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors">
                  <Check size={12} /> 저장
                </button>
                <button onClick={cancelSchedule}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)' }}>
                  <X size={12} /> 취소
                </button>
              </div>
            )}
          </div>

          {/* 근무 요일 */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>근무 요일</p>
            <div className="flex gap-1.5 flex-wrap">
              {DOW_LABELS.map((label, idx) => {
                const active = editSchedule
                  ? draftWorkDays.includes(idx)
                  : (designer.workDays ?? [0,1,2,3,4,5,6]).includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => editSchedule && toggleDow(idx)}
                    disabled={!editSchedule}
                    className="w-9 h-9 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: active ? '#6366f1' : 'var(--bg-muted)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      cursor: editSchedule ? 'pointer' : 'default',
                      border: 'none',
                    }}
                    aria-label={`${label}요일 ${active ? '근무' : '휴무'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 특정 휴무일 */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>특정 휴무일</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(editSchedule ? draftDayOff : (designer.dayOff ?? [])).map(date => (
                <span key={date}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--bg-danger-soft, #fff1f2)', color: '#e11d48', border: '1px solid #fecdd3' }}>
                  {date}
                  {editSchedule && (
                    <button onClick={() => removeDayOff(date)}
                      className="ml-0.5 hover:text-red-700"
                      aria-label={`${date} 휴무일 삭제`}>
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
              {(editSchedule ? draftDayOff : (designer.dayOff ?? [])).length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>등록된 특정 휴무일이 없습니다.</p>
              )}
            </div>
            {editSchedule && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDayOff}
                  onChange={e => setNewDayOff(e.target.value)}
                  className={inp + " flex-1"}
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  aria-label="휴무일 날짜 선택"
                />
                <button
                  onClick={addDayOff}
                  disabled={!newDayOff}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 transition-colors"
                  aria-label="휴무일 추가">
                  <Plus size={13} /> 추가
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 데이터 관리 ── */}
      <div className="rounded-2xl border p-5 space-y-4" style={card}>
        <div className="flex items-center gap-2">
          <HardDrive size={14} style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>데이터 관리</h3>
        </div>

        {/* 저장소 사용량 게이지 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>저장소 사용량</span>
            <span className="text-xs font-medium" style={{ color: percent >= 80 ? '#ef4444' : 'var(--text-secondary)' }}>
              {usedMB} MB / 약 5 MB ({percent}%)
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                backgroundColor: percent >= 80 ? '#ef4444' : percent >= 60 ? '#f97316' : '#f43f5e',
              }}
            />
          </div>
          {percent >= 80 && (
            <p className="text-xs mt-1 text-red-500">⚠ 저장공간이 부족합니다. 데이터를 내보낸 후 정리를 권장합니다.</p>
          )}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          데이터 내보내기 기능은 고객 개인정보 보호를 위해 제공되지 않습니다.
        </p>
      </div>

      {/* ── 비밀번호 변경 ── */}
      {onChangePassword && (() => {
        const [open, setOpen] = useState(false);
        const [newPw, setNewPw] = useState('');
        const [confirmPw, setConfirmPw] = useState('');
        const [showNew, setShowNew] = useState(false);
        const [showConfirm, setShowConfirm] = useState(false);
        const [pwError, setPwError] = useState('');
        const [pwSuccess, setPwSuccess] = useState(false);
        const [saving, setSaving] = useState(false);

        const handleChangePw = async (e: React.FormEvent) => {
          e.preventDefault();
          setPwError(''); setPwSuccess(false);
          if (newPw.length < 6) { setPwError('비밀번호는 6자 이상이어야 합니다.'); return; }
          if (newPw !== confirmPw) { setPwError('비밀번호가 일치하지 않습니다.'); return; }
          setSaving(true);
          const err = await onChangePassword(newPw);
          setSaving(false);
          if (err) { setPwError(err); }
          else { setPwSuccess(true); setNewPw(''); setConfirmPw(''); setTimeout(() => { setOpen(false); setPwSuccess(false); }, 1500); }
        };

        return (
          <div className="rounded-2xl border overflow-hidden" style={card}>
            <button onClick={() => { setOpen(v => !v); setPwError(''); setPwSuccess(false); }}
              className="w-full flex items-center justify-between px-5 py-4"
              aria-expanded={open}>
              <div className="flex items-center gap-2">
                <KeyRound size={15} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>비밀번호 변경</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{open ? '닫기 ▲' : '변경 ▼'}</span>
            </button>
            {open && (
              <form onSubmit={handleChangePw} className="px-5 pb-5 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                {pwSuccess ? (
                  <p className="text-xs px-3 py-2 rounded-lg text-center font-medium" style={{ color: 'var(--text-success)', backgroundColor: 'var(--bg-success)' }}>✓ 비밀번호가 변경되었습니다.</p>
                ) : (
                  <>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} required placeholder="새 비밀번호 (6자 이상)"
                        value={newPw} onChange={e => { setNewPw(e.target.value); setPwError(''); }}
                        className={`${inp} pr-10`}
                        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                      <button type="button" onClick={() => setShowNew(v => !v)} aria-label={showNew ? '숨기기' : '표시'}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} required placeholder="새 비밀번호 확인"
                        value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
                        className={`${inp} pr-10`}
                        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? '숨기기' : '표시'}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwError && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{pwError}</p>}
                    <button type="submit" disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                      {saving ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        );
      })()}

      {/* ── 사용 매뉴얼 ── */}
      {(() => {
        const base = import.meta.env.BASE_URL;
        const manual = isOwner
          ? { href: `${base}manuals/manual-owner.html`,    label: '원장 매뉴얼',     sub: '직원 관리 · 분석 · 데이터 백업',    color: '#d97706', bg: 'var(--bg-icon-amber)', border: '#fde68a' }
          : { href: `${base}manuals/manual-designer.html`, label: '디자이너 매뉴얼', sub: '고객 관리 · 이력 작성 · 예약 관리', color: '#4f46e5', bg: '#eef2ff',              border: '#c7d2fe' };
        return (
          <div className="rounded-2xl border p-5 space-y-3" style={card}>
            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>사용 매뉴얼</h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              앱 기능을 PDF 형태로 안내합니다. 링크 열기 후 브라우저에서 <strong>인쇄 → PDF로 저장</strong>하세요.
            </p>
            <a
              href={manual.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-all hover:shadow-sm"
              style={{ backgroundColor: manual.bg, borderColor: manual.border, textDecoration: 'none' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: manual.color }}>
                <BookOpen size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: manual.color }}>{manual.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{manual.sub}</p>
              </div>
              <span className="text-xs flex-shrink-0 font-medium" style={{ color: manual.color }}>열기 →</span>
            </a>
          </div>
        );
      })()}
    </div>
  );
}
