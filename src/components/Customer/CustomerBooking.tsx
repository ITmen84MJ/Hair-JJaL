import { useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, Scissors, MessageSquare, CheckCircle2, MapPin } from 'lucide-react';
import { Booking, ServiceType, Designer, Client, Shop } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';
import { inputCls as inp, inputStyle as inpStyle } from '../../styles/form';

interface Props {
  client: Client;
  shops: Shop[];
  allDesigners: Designer[];
  allBookings: Booking[];
  defaultShopId: string;
  onSubmit: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

function generateTimeSlots(openTime = '10:00', closeTime = '19:00', interval = 30): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += interval;
  }
  return slots;
}

const SERVICE_OPTIONS: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

const PREFILL_KEY = 'hairjjal_booking_prefill_date';

/** 선택한 날짜에 디자이너가 근무 가능한지 확인 */
function isDesignerAvailable(d: Designer, selectedDate: string): boolean {
  if (!selectedDate) return true;
  if (d.dayOff?.includes(selectedDate)) return false;
  if (d.workDays && d.workDays.length < 7) {
    // new Date(date + 'T12:00') prevents timezone-shift to previous day
    const dow = new Date(selectedDate + 'T12:00:00').getDay();
    if (!d.workDays.includes(dow)) return false;
  }
  return true;
}

export function CustomerBooking({ client, shops, allDesigners, allBookings, defaultShopId, onSubmit, onBack }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedShopId, setSelectedShopId] = useState(defaultShopId);
  const [date, setDate] = useState(() => {
    const prefill = sessionStorage.getItem(PREFILL_KEY) ?? '';
    if (prefill) sessionStorage.removeItem(PREFILL_KEY);
    return prefill >= today ? prefill : '';
  });
  const [time, setTime] = useState('');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [designer, setDesigner] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dupWarning, setDupWarning] = useState(false);

  // 선택된 지점 정보
  const selectedShop = shops.find(s => s.id === selectedShopId);

  // 선택된 지점의 영업 시간 기반 시간 슬롯
  const TIME_SLOTS = generateTimeSlots(
    selectedShop?.openTime,
    selectedShop?.closeTime,
    selectedShop?.slotInterval,
  );

  // 선택된 지점의 재직 중 디자이너만
  const designers = allDesigners.filter(d => d.shopId === selectedShopId && d.status === 'active');

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    setDesigner('');
    setTime('');
    setDupWarning(false);
  };

  const toggleService = (s: ServiceType) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || services.length === 0) return;

    // P1-12: 같은 지점·날짜·시간·디자이너 중복 체크
    const isDuplicate = allBookings.some(b =>
      b.shopId === selectedShopId &&
      b.requestedDate === date &&
      b.requestedTime === time &&
      b.status !== 'cancelled' &&
      (!designer || !b.preferredDesigner || b.preferredDesigner === designer)
    );
    if (isDuplicate) {
      setDupWarning(true);
      return;
    }

    onSubmit({
      shopId: selectedShopId,
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
          {shops.find(s => s.id === selectedShopId)?.name ?? ''}<br />
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


  return (
    <div className="p-5 space-y-5 max-w-lg mx-auto" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>예약 신청</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Shop / Branch */}
        {shops.length > 1 && (
          <div className="rounded-2xl border p-5 space-y-3" style={card}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-rose-400" />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>지점 선택 *</p>
            </div>
            <div className="space-y-2">
              {shops.map(shop => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => handleShopChange(shop.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selectedShopId === shop.id
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : ''
                  }`}
                  style={selectedShopId !== shop.id ? { borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' } : {}}
                >
                  <p className="text-sm font-semibold">{shop.name}</p>
                  {shop.address && (
                    <p className={`text-xs mt-0.5 ${selectedShopId === shop.id ? 'text-white/80' : ''}`}
                      style={selectedShopId !== shop.id ? { color: 'var(--text-muted)' } : {}}>
                      {shop.address}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(() => {
              const currentTime = new Date().toTimeString().slice(0, 5);
              const available = TIME_SLOTS.filter(t => date !== today || t > currentTime);
              if (available.length === 0) {
                return <p className="col-span-3 sm:col-span-4 text-xs py-2" style={{ color: 'var(--text-muted)' }}>오늘은 예약 가능한 시간이 없습니다.</p>;
              }
              return available.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
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
          <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            담당 디자이너 <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(선택)</span>
          </p>
          <div className="space-y-2">
            {/* "No preference" */}
            <button type="button" onClick={() => setDesigner('')}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border text-left transition-colors ${designer === '' ? 'bg-rose-500 text-white border-rose-500' : ''}`}
              style={designer !== '' ? { borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' } : {}}>
              상관없음
            </button>
            {designers.map(d => {
              const available = isDesignerAvailable(d, date);
              const isSelected = designer === d.name;
              return (
                <button key={d.id} type="button"
                  onClick={() => { if (available) setDesigner(d.name); }}
                  disabled={!available}
                  className={`w-full px-4 py-3 rounded-xl border text-left transition-colors ${isSelected ? 'bg-rose-500 border-rose-500' : ''} ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={!isSelected ? { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' } : {}}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isSelected ? 'bg-white/20 text-white' : ''}`}
                      style={!isSelected ? { backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' } : {}}>
                      {d.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}
                          style={!isSelected ? { color: 'var(--text-primary)' } : {}}>
                          {d.name}
                        </span>
                        {!available && date && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--bg-neutral)', color: 'var(--text-neutral)' }}>이날 휴무</span>
                        )}
                      </div>
                      {d.bio && (
                        <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-white/80' : ''}`}
                          style={!isSelected ? { color: 'var(--text-muted)' } : {}}>
                          {d.bio}
                        </p>
                      )}
                      {d.specialties && d.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.specialties.slice(0, 3).map(s => (
                            <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : ''}`}
                              style={!isSelected ? { backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' } : {}}>
                              {SERVICE_LABELS[s]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
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

        {dupWarning && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
            <span className="flex-shrink-0 font-bold">⚠</span>
            <span>선택하신 날짜·시간에 이미 예약이 있습니다. 다른 시간을 선택해 주세요.</span>
          </div>
        )}
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
