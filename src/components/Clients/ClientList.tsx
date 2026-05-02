import { useState } from 'react';
import { Search, Plus, Phone, ChevronRight, Trash2 } from 'lucide-react';
import { Client, Consultation } from '../../types';
import { ClientForm } from './ClientForm';
import { format, parseISO } from 'date-fns';

interface Props {
  clients: Client[];
  consultations: Consultation[];
  onSelectClient: (id: string) => void;
  onAddClient: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onDeleteClient: (id: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function ClientList({ clients, consultations, onSelectClient, onAddClient, onDeleteClient }: Props) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = clients.filter(c =>
    c.name.includes(search) ||
    c.phone.replace(/-/g, '').includes(search.replace(/-/g, '')) ||
    (c.email ?? '').includes(search)
  );

  const lastConsultation = (id: string) =>
    consultations.filter(c => c.clientId === id).sort((a, b) => b.date.localeCompare(a.date))[0];

  const visitCount = (id: string) => consultations.filter(c => c.clientId === id).length;

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>고객 관리</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>총 {clients.length}명</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> 고객 추가
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="이름, 전화번호, 이메일 검색" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }} />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</div>
        )}
        {filtered.map(client => {
          const last = lastConsultation(client.id);
          const count = visitCount(client.id);
          return (
            <div key={client.id} className="rounded-xl border transition-all group" style={card}>
              <button onClick={() => onSelectClient(client.id)} className="w-full flex items-center gap-4 p-4 text-left">
                <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-rose-600">{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.name}</span>
                    {client.tags?.map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={11} />
                    <span>{client.phone}</span>
                    <span className="mx-1">·</span>
                    <span>방문 {count}회</span>
                    {last && <><span className="mx-1">·</span><span>마지막 {format(parseISO(last.date), 'yy.MM.dd')}</span></>}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              <div className="px-4 pb-3 flex justify-end">
                <button onClick={e => { e.stopPropagation(); if (confirm(`${client.name} 고객을 삭제할까요?`)) onDeleteClient(client.id); }}
                  className="text-xs flex items-center gap-1 transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <ClientForm onSave={data => { onAddClient(data); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}
