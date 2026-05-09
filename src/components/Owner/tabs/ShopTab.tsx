import { useState } from 'react';
import { Store, Edit2, Check, X, Download, Upload, Database, FileText, Cloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Client, Consultation, Shop } from '../../../types';
import { getStorageUsage, exportData, importData } from '../../../utils/backup';
import { exportAllClients } from '../../../utils/csv';
import { USE_SUPABASE } from '../../../lib/supabase';
import {
  migrateLocalStorageToSupabase,
  hasMigratableData,
  isMigrationDone,
  type MigrationResult,
} from '../../../utils/dataMigration';

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

// ── CloudMigrationSection ────────────────────────────────────────────────────
/** Supabase 모드에서만 표시: localStorage → Supabase 일회성 데이터 이전 UI */
function CloudMigrationSection({ shopId }: { shopId: string }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(() =>
    isMigrationDone() ? 'done' : 'idle'
  );
  const [result, setResult] = useState<MigrationResult | null>(null);
  const hasData = hasMigratableData();

  const run = async () => {
    setStatus('running');
    const res = await migrateLocalStorageToSupabase(shopId);
    setResult(res);
    setStatus(res.success ? 'done' : 'error');
  };

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="flex items-center gap-2">
        <Cloud size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>클라우드 데이터 이전</h3>
        {status === 'done' && <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> 완료</span>}
      </div>

      {status === 'done' && result ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-600">이전이 완료되었습니다.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>고객</span>       <span className="font-semibold">{result.counts.clients}명</span>
            <span>상담 기록</span>  <span className="font-semibold">{result.counts.consultations}건</span>
            <span>디자이너</span>   <span className="font-semibold">{result.counts.designers}명</span>
            <span>예약</span>       <span className="font-semibold">{result.counts.bookings}건</span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            기존 로컬 데이터는 그대로 유지됩니다. 확인 후 수동으로 삭제하세요.
          </p>
        </div>
      ) : status === 'done' ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>이미 클라우드로 데이터를 이전했습니다.</p>
      ) : status === 'error' && result ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            <AlertCircle size={13} /> 이전 실패: {result.error}
          </div>
          <button onClick={run}
            className="text-xs px-3 py-2 rounded-xl border border-rose-400 text-rose-500 hover:bg-rose-50 transition-colors">
            다시 시도
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            기기의 로컬 데이터를 Supabase 클라우드로 이전합니다.
            이전 완료 후 여러 기기·여러 디자이너가 동시에 데이터를 공유할 수 있습니다.
          </p>
          {!hasData && (
            <p className="text-xs text-amber-500">이전할 로컬 데이터가 없습니다.</p>
          )}
          <button
            onClick={run}
            disabled={status === 'running' || !hasData}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'running' ? (
              <><Loader size={13} className="animate-spin" /> 이전 중…</>
            ) : (
              <><Cloud size={13} /> 클라우드로 데이터 이전</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── DataManagementSection ────────────────────────────────────────────────────
function DataManagementSection({ clients, consultations }: { clients: Client[]; consultations: Consultation[] }) {
  const [importError, setImportError] = useState('');
  const { usedMB, percent } = getStorageUsage();

  const barColor = percent >= 80 ? '#ef4444' : percent >= 60 ? '#f59e0b' : '#10b981';

  return (
    <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="flex items-center gap-2">
        <Database size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>데이터 관리</h3>
      </div>

      {/* 저장 공간 게이지 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>저장 공간 사용량</p>
          <p className="text-xs font-bold" style={{ color: percent >= 80 ? '#ef4444' : 'var(--text-muted)' }}>
            {usedMB} MB / 약 5 MB ({percent}%)
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: barColor }} />
        </div>
        {percent >= 80 && (
          <p className="text-xs mt-1.5 text-red-500">
            저장 공간이 부족합니다. 데이터를 내보내거나 오래된 사진을 삭제해 주세요.
          </p>
        )}
      </div>

      {/* JSON 전체 백업 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>전체 데이터 백업 (JSON)</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          모든 고객·시술 이력·예약·직원 정보를 JSON 파일로 저장합니다. 다른 기기로 이전하거나 복원할 때 사용하세요.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors hover:border-rose-400 hover:text-rose-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download size={13} /> JSON 내보내기
          </button>
          <button
            onClick={() => importData(setImportError)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors hover:border-rose-400 hover:text-rose-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Upload size={13} /> JSON 가져오기
          </button>
        </div>
        {importError && <p className="text-xs text-red-500">{importError}</p>}
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          ⚠ 가져오기 시 현재 데이터가 백업 파일로 교체됩니다. 먼저 내보내기로 현재 데이터를 저장해 두세요.
        </p>
      </div>

      {/* CSV 내보내기 */}
      <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>고객 목록 내보내기 (CSV)</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          전체 고객 기본 정보를 엑셀·스프레드시트에서 열 수 있는 CSV 파일로 내보냅니다.
        </p>
        <button
          onClick={() => exportAllClients(clients, consultations)}
          disabled={clients.length === 0}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors hover:border-rose-400 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <FileText size={13} /> 전체 고객 CSV ({clients.length}명)
        </button>
      </div>
    </div>
  );
}

// ── ShopTab (main export) ────────────────────────────────────────────────────
interface Props {
  shop: Shop | null;
  clients: Client[];
  consultations: Consultation[];
  onUpdateShop: (data: Partial<Shop>) => void;
}

export function ShopTab({ shop, clients, consultations, onUpdateShop }: Props) {
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: shop?.name ?? '',
    address: shop?.address ?? '',
    phone: shop?.phone ?? '',
    openTime: shop?.openTime ?? '10:00',
    closeTime: shop?.closeTime ?? '19:00',
    slotInterval: String(shop?.slotInterval ?? 30),
  });

  const startEdit = () => {
    if (!shop) return;
    setShopForm({
      name: shop.name,
      address: shop.address ?? '',
      phone: shop.phone ?? '',
      openTime: shop.openTime ?? '10:00',
      closeTime: shop.closeTime ?? '19:00',
      slotInterval: String(shop.slotInterval ?? 30),
    });
    setEditingShop(true);
  };

  return (
    <div className="space-y-4">
      {shop && (
        <div className="rounded-2xl border p-5 space-y-4" style={card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={16} style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>지점 정보</h3>
            </div>
            {!editingShop ? (
              <button onClick={startEdit} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}
                aria-label="지점 정보 수정">
                <Edit2 size={15} />
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onUpdateShop({ ...shopForm, slotInterval: Number(shopForm.slotInterval) }); setEditingShop(false); }}
                  className="p-1.5 rounded-lg bg-rose-500 text-white" aria-label="저장">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingShop(false)}
                  className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  aria-label="취소">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {editingShop ? (
            <div className="space-y-3">
              {([['지점명 *', 'name'], ['주소', 'address'], ['전화번호', 'phone']] as const).map(([label, key]) => (
                <div key={key}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <input
                    value={shopForm[key]}
                    onChange={e => setShopForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>예약 시간 설정</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['오픈', 'openTime', 'time'],
                    ['마감', 'closeTime', 'time'],
                  ] as const).map(([label, key, type]) => (
                    <div key={key}>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <input type={type} value={shopForm[key]}
                        onChange={e => setShopForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                    </div>
                  ))}
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>간격(분)</p>
                    <select value={shopForm.slotInterval}
                      onChange={e => setShopForm(f => ({ ...f, slotInterval: e.target.value }))}
                      className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                      <option value="30">30분</option>
                      <option value="60">60분</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>지점명</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{shop.name}</p>
              </div>
              {shop.address && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>주소</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.address}</p>
                </div>
              )}
              {shop.phone && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>전화번호</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>예약 시간</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {shop.openTime ?? '10:00'} ~ {shop.closeTime ?? '19:00'} ({shop.slotInterval ?? 30}분 간격)
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>개점일</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.createdAt.slice(0, 10)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Supabase 모드에서만: localStorage → Cloud 이전 UI */}
      {USE_SUPABASE && shop && (
        <CloudMigrationSection shopId={shop.id} />
      )}

      <DataManagementSection clients={clients} consultations={consultations} />
    </div>
  );
}
