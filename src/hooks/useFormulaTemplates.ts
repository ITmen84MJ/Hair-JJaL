import { useState, useCallback } from 'react';

const FORMULA_KEY = 'hairjjal_formula_templates';

interface Templates {
  color: string[];
  perm: string[];
}

function load(): Templates {
  try {
    const raw = localStorage.getItem(FORMULA_KEY);
    return raw ? JSON.parse(raw) : { color: [], perm: [] };
  } catch {
    return { color: [], perm: [] };
  }
}

/**
 * 컬러/펌 포뮬러 템플릿을 localStorage에 저장·관리한다.
 * ConsultationForm에서 자주 쓰는 포뮬러를 저장해 두고 재사용.
 */
export function useFormulaTemplates() {
  const [templates, setTemplates] = useState<Templates>(load);

  const persist = useCallback((t: Templates) => {
    setTemplates(t);
    localStorage.setItem(FORMULA_KEY, JSON.stringify(t));
  }, []);

  /** 새 템플릿 추가 (중복 무시) */
  const addTemplate = useCallback((type: 'color' | 'perm', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = load();
    if (current[type].includes(trimmed)) return;
    persist({ ...current, [type]: [...current[type], trimmed] });
  }, [persist]);

  /** 템플릿 삭제 */
  const removeTemplate = useCallback((type: 'color' | 'perm', value: string) => {
    const current = load();
    persist({ ...current, [type]: current[type].filter(v => v !== value) });
  }, [persist]);

  return { templates, addTemplate, removeTemplate };
}
