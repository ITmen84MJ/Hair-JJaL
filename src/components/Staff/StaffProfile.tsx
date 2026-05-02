import { useState, useRef } from 'react';
import {
  Mail, Phone, Calendar, Building2, Edit2, Check, X,
  Users, FileText, TrendingUp, Crown, Scissors, User,
  Download, Upload, HardDrive, Table2,
} from 'lucide-react';
import { exportData, importData, getStorageUsage } from '../../utils/backup';
import { exportClientsCSV, exportConsultationsCSV } from '../../utils/csv';
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
  onUpdateDesigner, onUpdateShop, onUpdateName,
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

  /* ── 데이터 관리 ── */
  const importRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { usedMB, percent } = getStorageUsage();
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importData(file);
    setImportStatus(ok ? 'success' : 'error');
    if (ok) setTimeout(() => window.location.reload(), 1200);
    e.target.value = '';
  };

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

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-rose-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download size={13} /> 데이터 내보내기
          </button>

          {/* 원장 전용: 가져오기 + CSV 내보내기 */}
          {isOwner && (
            <>
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-rose-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Upload size={13} /> 데이터 가져오기
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button
                onClick={() => exportClientsCSV(shopClients, shopConsultations)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-rose-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Table2 size={13} /> 고객 CSV
              </button>
              <button
                onClick={() => exportConsultationsCSV(shopClients, shopConsultations)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-rose-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Table2 size={13} /> 시술 CSV
              </button>
            </>
          )}
        </div>

        {importStatus === 'success' && (
          <p className="text-xs text-emerald-600">✓ 가져오기 성공! 잠시 후 새로고침됩니다.</p>
        )}
        {importStatus === 'error' && (
          <p className="text-xs text-red-500">✗ 가져오기 실패. Hair JJaL 백업 파일인지 확인해 주세요.</p>
        )}
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          내보내기 파일은 JSON 형식으로 저장됩니다. 가져오기 시 현재 데이터를 덮어씁니다.
        </p>
      </div>
    </div>
  );
}
