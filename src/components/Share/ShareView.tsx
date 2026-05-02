import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Scissors, Calendar, User, FlaskConical, Droplets, Camera, AlertCircle } from 'lucide-react';
import { Client, Consultation } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';

interface Props {
  consultation: Consultation | null;
  client: Client | null;
}

export function ShareView({ consultation, client }: Props) {
  if (!consultation || !client) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-700 mb-1">공유 링크를 찾을 수 없습니다</h2>
          <p className="text-sm text-gray-400">링크가 만료되었거나 비활성화된 공유 링크입니다.</p>
        </div>
      </div>
    );
  }

  const con = consultation;
  const totalPrice = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-rose-100">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center">
            <Scissors size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-800">HairLog</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-4">
        {/* Client greeting */}
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">안녕하세요, {client.name} 고객님</p>
          <p className="text-gray-800 font-semibold mt-0.5">시술 내역을 확인해보세요 ✨</p>
        </div>

        {/* Date & Stylist */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-rose-400" />
                <span className="font-medium">{format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={14} className="text-rose-400" />
                <span>{con.stylistName} 스타일리스트</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-rose-600">{totalPrice.toLocaleString()}원</p>
              <p className="text-xs text-gray-400">총 금액</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex flex-wrap gap-1.5">
              {con.services.map((svc, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${SERVICE_COLORS[svc.type]}`}>
                  {SERVICE_LABELS[svc.type]}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {con.services.map((svc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{svc.description}</span>
                  {svc.price && <span className="text-gray-500">{svc.price.toLocaleString()}원</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Before / After */}
        {(con.beforePhoto || con.afterPhoto) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={14} className="text-rose-400" />
              <p className="text-sm font-medium text-gray-700">Before / After</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {con.beforePhoto && (
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1.5">Before</p>
                  <SafeImg src={con.beforePhoto} alt="before" className="w-full aspect-[4/5] object-cover rounded-xl" />
                </div>
              )}
              {con.afterPhoto && (
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1.5">After</p>
                  <SafeImg src={con.afterPhoto} alt="after" className="w-full aspect-[4/5] object-cover rounded-xl" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hair condition */}
        {(con.hairCondition || con.scalp) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-rose-400" />
              <p className="text-sm font-medium text-gray-700">모발 · 두피 상태</p>
            </div>
            {con.hairCondition && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 mb-0.5">모발</p>
                <p className="text-sm text-gray-700">{con.hairCondition}</p>
              </div>
            )}
            {con.scalp && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">두피</p>
                <p className="text-sm text-gray-700">{con.scalp}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {con.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">스타일리스트 메모</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{con.notes}</p>
          </div>
        )}

        {/* Next visit */}
        {con.nextVisitDate && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-rose-600 mb-1">다음 방문 안내</p>
            <p className="text-base font-bold text-rose-800">
              {format(parseISO(con.nextVisitDate), 'yyyy년 M월 d일', { locale: ko })}
            </p>
            {con.nextVisitNote && <p className="text-sm text-rose-700 mt-0.5">{con.nextVisitNote}</p>}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Powered by HairLog</p>
      </div>
    </div>
  );
}
