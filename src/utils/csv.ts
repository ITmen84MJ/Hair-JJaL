import { Client, Consultation } from '../types';
import { SERVICE_LABELS } from '../components/Consultations/serviceLabels';

/**
 * 고객 + 시술 이력 CSV 내보내기
 * BOM(UTF-8 with BOM) 추가로 Excel 한글 깨짐 방지
 */
export function exportClientsCSV(clients: Client[], consultations: Consultation[]): void {
  const BOM = '﻿';
  const header = ['고객명', '전화번호', '이메일', '성별', '생년월일', '태그', '메모',
    '총방문', '마지막방문', '총매출(원)'];

  const rows: string[][] = clients.map(c => {
    const cons = consultations.filter(cn => cn.clientId === c.id);
    const sorted = [...cons].sort((a, b) => b.date.localeCompare(a.date));
    const totalSpend = cons.reduce((s, cn) => s + cn.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
    return [
      c.name,
      c.phone,
      c.email ?? '',
      c.gender === 'female' ? '여성' : c.gender === 'male' ? '남성' : '기타',
      c.birthDate ?? '',
      (c.tags ?? []).join('|'),
      c.notes ?? '',
      String(cons.length),
      sorted[0]?.date ?? '',
      String(totalSpend),
    ];
  });

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadCSV(BOM + csvContent, `고객목록_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * 시술 이력 CSV 내보내기
 */
export function exportConsultationsCSV(clients: Client[], consultations: Consultation[]): void {
  const BOM = '﻿';
  const header = ['날짜', '고객명', '스타일리스트', '시술', '컬러포뮬러', '펌포뮬러',
    '모발상태', '두피', '메모', '금액(원)', '다음방문예정'];

  const rows: string[][] = [...consultations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(con => {
      const clientName = clients.find(c => c.id === con.clientId)?.name ?? '';
      const services = con.services.map(s =>
        `${SERVICE_LABELS[s.type]}${s.description ? `(${s.description})` : ''}`
      ).join('|');
      const total = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);
      return [
        con.date,
        clientName,
        con.stylistName,
        services,
        con.colorFormula ?? '',
        con.permFormula ?? '',
        con.hairCondition ?? '',
        con.scalp ?? '',
        con.notes ?? '',
        String(total),
        con.nextVisitDate ?? '',
      ];
    });

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadCSV(BOM + csvContent, `시술이력_${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
