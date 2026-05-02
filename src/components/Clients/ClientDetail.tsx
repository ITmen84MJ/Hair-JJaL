import { useState } from 'react';
import { ArrowLeft, Phone, Mail, Plus, Edit2, Scissors, BarChart2 } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client, Consultation } from '../../types';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';
import { ClientForm } from './ClientForm';
import { ConsultationForm } from '../Consultations/ConsultationForm';
import { ClientStats } from './ClientStats';

interface Props {
  client: Client;
  consultations: Consultation[];
  onBack: () => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onAddConsultation: (data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt' | 'shopId'>) => void;
  onSelectConsultation: (id: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function ClientDetail({ client, consultations, onBack, onUpdateClient, onAddConsultation, onSelectConsultation }: Props) {
  const [showEditClient, setShowEditClient] = useState(false);
  const [showAddCon, setShowAddCon] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');

  const sorted = [...consultations].sort((a, b) => b.date.localeCompare(a.date));
  const age = client.birthDate ? differenceInYears(new Date(), parseISO(client.birthDate)) : null;
  const totalSpend = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>고객 상세</h1>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border p-5" style={card}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-rose-600">{client.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
                  {client.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">여성</span>}
                  {client.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">남성</span>}
                </div>
                {age !== null && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{age}세 · {client.birthDate}</p>}
              </div>
              <button onClick={() => setShowEditClient(true)} className="p-1 hover:text-rose-500" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Phone size={13} style={{ color: 'var(--text-muted)' }} />{client.phone}</div>
              {client.email && <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Mail size={13} style={{ color: 'var(--text-muted)' }} />{client.email}</div>}
            </div>
            {client.tags?.length && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {client.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>{tag}</span>)}
              </div>
            )}
            {client.notes && <p className="mt-3 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-note)', color: 'var(--text-secondary)' }}>{client.notes}</p>}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{consultations.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 방문 횟수</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalSpend.toLocaleString()}원</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 매출</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-muted)' }}>
        {([['history', '상담 이력', Scissors], ['stats', '통계/차트', BarChart2]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
            style={activeTab === id
              ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }
              : { color: 'var(--text-muted)' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && <ClientStats consultations={consultations} />}

      {activeTab === 'history' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>상담 이력 ({sorted.length})</h3>
            <button onClick={() => setShowAddCon(true)} className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> 상담 추가
            </button>
          </div>
          {sorted.length === 0 && (
            <div className="rounded-xl py-12 text-center text-sm border-2 border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <Scissors size={32} className="mx-auto mb-2 opacity-30" />아직 상담 이력이 없습니다.
            </div>
          )}
          <div className="relative">
            {sorted.length > 0 && <div className="absolute left-5 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />}
            <div className="space-y-3">
              {sorted.map(con => (
                <button key={con.id} onClick={() => onSelectConsultation(con.id)} className="relative w-full flex gap-4 text-left">
                  <div className="relative z-10 w-10 h-10 rounded-full border-2 border-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <Scissors size={14} className="text-rose-400" />
                  </div>
                  <div className="flex-1 rounded-xl p-4 border transition-all" style={card}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{con.stylistName} 스타일리스트</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {con.isShared && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">공유중</span>}
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{con.services.reduce((s, svc) => s + (svc.price ?? 0), 0).toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {con.services.map((svc, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_COLORS[svc.type]}`}>{SERVICE_LABELS[svc.type]}</span>)}
                    </div>
                    {con.afterPhoto && <img src={con.afterPhoto} alt="after" className="mt-3 w-16 h-16 object-cover rounded-lg" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEditClient && <ClientForm initial={client} onSave={data => { onUpdateClient(client.id, data); setShowEditClient(false); }} onClose={() => setShowEditClient(false)} />}
      {showAddCon && <ConsultationForm clientId={client.id} clientName={client.name} onSave={data => { onAddConsultation(data); setShowAddCon(false); }} onClose={() => setShowAddCon(false)} />}
    </div>
  );
}
