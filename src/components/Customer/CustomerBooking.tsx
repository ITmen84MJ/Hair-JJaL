import { useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, Scissors, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Booking, ServiceType, Designer, Client } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

interface Props {
  client: Client;
  designers: Designer[];
  onSubmit: (data: Omit<Booking, 'id' | 'createdAt' | 'shopId'>) => void;
  onBack: () => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00',
  '13:00', '13:30', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00',
];

const SERVICE_OPTIONS: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

export function CustomerBooking({ client, designers, onSubmit, onBack }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [designer, setDesigner] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleService = (s: ServiceType) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || services.length === 0) return;
    onSubmit({
      clientId: client.id,
      clientName: client.name,
      requestedDate: date,
      requestedTime: time,
      serviceTypes: services,
      preferredDesigner: designer || undefined,
      notes: notes.trim() || undefined,
      status: 'pending',
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>예약 신청 완료!</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {date} {time}에 예약 신청이 접수되었습니다.<br />
          확정 시 알려드릴게요.
        </p>
        <button onClick={onBack}
          className="mt-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  const inpStyle = { borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

  return (
    <div className="p-5 space-y-5 max-w-lg mx-auto" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>예약 신청</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Date */}
        <div className="rounded-2xl border p-5 space-y-3" style={card}>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={15} className="text-rose-400" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>날짜 선택 *</p>
          </div>
          <input
            type="date"
            required
            min={today}
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inp}
            style={inpStyle}
          />
        </div>

        {/* Time */}
        <div className="rounded-2xl border p-5 space-y-3" style={card}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} className="text-rose-400" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>시간 선택 *</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {(() => {
              const currentTime = new Date().toTimeString().slice(0, 5);
              const available = TIME_SLOTS.filter(t => date !== today || t > currentTime);
              if (available.length === 0) {
                return <p className="col-span-4 sm:col-span-6 text-xs py-2" style={{ color: 'var(--text-muted)' }}>오늘은 예약 가능한 시간이 없습니다.</p>;
              }
              return available.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    time === t
                      ? 'bg-rose-500 text-white border-rose-500'
                      : ''
                  }`}
                  style={time !== t ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
                >
                  {t}
                </button>
              ));
            })()}
          </div>
        </div>

        {/* Services */}
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-2 mb-3">
            <Scissors size={15} className="text-rose-400" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>시술 선택 * <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(복수 선택 가능)</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  services.includes(s) ? 'bg-rose-500 text-white border-rose-500' : ''
                }`}
                style={!services.includes(s) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
              >
                {SERVICE_LABELS[s]}
              </button>
            ))}
          </div>
          {services.length === 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>시술을 하나 이상 선택해 주세요.</p>
          )}
        </div>

        {/* Designer preference */}
        <div className="rounded-2xl border p-5" style={card}>
          <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>담당 디자이너 <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(선택)</span></p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDesigner('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                designer === '' ? 'bg-rose-500 text-white border-rose-500' : ''
              }`}
              style={designer !== '' ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
            >
              상관없음
            </button>
            {designers.filter(d => d.status === 'active').map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDesigner(d.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  designer === d.name ? 'bg-rose-500 text-white border-rose-500' : ''
                }`}
                style={designer !== d.name ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-rose-400" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>요청 사항 <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(선택)</span></p>
          </div>
          <textarea
            rows={3}
            placeholder="원하시는 스타일이나 요청 사항을 자유롭게 적어주세요."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`${inp} resize-none`}
            style={inpStyle}
          />
        </div>

        <button
          type="submit"
          disabled={!date || !time || services.length === 0}
          className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm shadow-rose-200"
        >
          예약 신청하기
        </button>
      </form>
    </div>
  );
}
