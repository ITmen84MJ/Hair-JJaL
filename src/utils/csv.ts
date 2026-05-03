import { Client, Consultation } from '../types';
import { SERVICE_LABELS } from '../components/Consultations/serviceLabels';

/** CSV 셀 값을 안전하게 이스케이프 (따옴표·줄바꿈 처리) */
function esc(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const s = String(val);
  // 쉼표, 따옴표, 줄바꿈이 있으면 큰따옴표로 감싸고 내부 따옴표는 두 번 씀
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toRow(...cells: (string | number | undefined | null)[]) {
  return cells.map(esc).join(',');
}

function download(csv: string, filename: string) {
  const BOM = '﻿'; // Excel에서 한글 깨짐 방지
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 특정 고객의 시술 이력을 CSV 파일로 다운로드합니다.
 */
export function exportClientHistory(client: Client, consultations: Consultation[]): void {
  const headers = toRow('날짜', '스타일리스트', '시술항목', '시술설명', '총금액(원)', '모발상태', '두피상태', '메모', '다음방문일');

  const sorted = [...consultations].sort((a, b) => b.date.localeCompare(a.date));

  const lines = sorted.map(c => {
    const totalPrice = c.services.reduce((s, svc) => s + (svc.price ?? 0), 0);
    const serviceTypes = c.services
      .map(svc => SERVICE_LABELS[svc.type] ?? svc.type)
      .join(' / ');
    const serviceDescs = c.services
      .map(svc => svc.description)
      .filter(Boolean)
      .join(' / ');
    return toRow(
      c.date,
      c.stylistName,
      serviceTypes,
      serviceDescs,
      totalPrice || '',
      c.hairCondition,
      c.scalp,
      c.notes,
      c.nextVisitDate,
    );
  });

  const csv = [headers, ...lines].join('\r\n');
  download(csv, `${client.name}_시술이력_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * 전체 고객 목록(기본 정보)을 CSV로 다운로드합니다.
 */
export function exportAllClients(clients: Client[], consultations: Consultation[]): void {
  const headers = toRow('이름', '성별', '전화번호', '이메일', '생년월일', '총방문횟수', '마지막방문일', '태그', '메모');

  const lines = clients.map(c => {
    const clientCons = consultations.filter(con => con.clientId === c.id);
    const lastDate = clientCons.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
    return toRow(
      c.name,
      c.gender === 'female' ? '여성' : c.gender === 'male' ? '남성' : '',
      c.phone,
      c.email,
      c.birthDate,
      clientCons.length || '',
      lastDate,
      c.tags?.join(' / '),
      c.notes,
    );
  });

  const csv = [headers, ...lines].join('\r\n');
  download(csv, `전체고객_${new Date().toISOString().slice(0, 10)}.csv`);
}
