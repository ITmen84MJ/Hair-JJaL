import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Booking, Client, Consultation, Designer, Shop } from '../../types';
import { AnalyticsTab, PeriodKey } from './tabs/AnalyticsTab';
import { StaffTab } from './tabs/StaffTab';
import { ShopTab } from './tabs/ShopTab';

interface Props {
  shop: Shop | null;
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  bookings?: Booking[];
  onAddDesigner: (data: Omit<Designer, 'id' | 'shopId'>, password: string) => Promise<void> | void;
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
  onUpdateShop: (data: Partial<Shop>) => void;
}

type Tab = 'stats' | 'staff' | 'shop';

export function OwnerDashboard({ shop, clients, consultations, designers, bookings = [], onAddDesigner, onUpdateDesigner, onUpdateShop }: Props) {
  const [tab, setTab] = useState<Tab>('stats');
  const [periodKey, setPeriodKey] = useState<PeriodKey>('6months');

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>원장 대시보드</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>전체 매출 및 직원 관리</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {([['stats', '전체 통계'], ['staff', '직원 관리'], ['shop', '지점 정보']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-rose-500 text-white shadow-sm' : ''}`}
            style={tab !== id ? { color: 'var(--text-secondary)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <AnalyticsTab
          clients={clients}
          consultations={consultations}
          designers={designers}
          bookings={bookings}
          periodKey={periodKey}
          onPeriodChange={setPeriodKey}
        />
      )}

      {tab === 'staff' && (
        <StaffTab
          designers={designers}
          consultations={consultations}
          onAddDesigner={onAddDesigner}
          onUpdateDesigner={onUpdateDesigner}
        />
      )}

      {tab === 'shop' && (
        <ShopTab
          shop={shop}
          clients={clients}
          consultations={consultations}
          onUpdateShop={onUpdateShop}
        />
      )}
    </div>
  );
}
