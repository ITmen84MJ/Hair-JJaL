import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Toast, toastStore } from '../../hooks/useToast';

const STYLES: Record<Toast['type'], {
  bg: string; border: string; text: string; Icon: React.ElementType; iconColor: string;
}> = {
  success: { bg: 'var(--bg-success)',  border: 'var(--border-success)',  text: 'var(--text-success)',  Icon: CheckCircle2,   iconColor: 'var(--text-success)'  },
  error:   { bg: 'var(--bg-danger)',   border: 'var(--border-danger)',   text: 'var(--text-danger)',   Icon: XCircle,        iconColor: 'var(--text-danger)'   },
  warning: { bg: 'var(--bg-warning)',  border: 'var(--border-warning)',  text: 'var(--text-warning)',  Icon: AlertTriangle,  iconColor: 'var(--text-warning)'  },
  info:    { bg: 'var(--bg-neutral)',  border: 'var(--border)',          text: 'var(--text-secondary)',Icon: Info,           iconColor: 'var(--text-muted)'    },
};

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => toastStore.subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {items.map(t => {
        const { bg, border, text, Icon, iconColor } = STYLES[t.type];
        return (
          <div key={t.id}
            className="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg pointer-events-auto animate-[fadeSlideDown_0.2s_ease-out]"
            style={{ backgroundColor: bg, borderColor: border }}>
            <Icon size={16} style={{ color: iconColor, flexShrink: 0, marginTop: 2 }} />
            <p className="flex-1 text-sm font-medium" style={{ color: text }}>{t.message}</p>
            <button onClick={() => toastStore.dismiss(t.id)} style={{ color: text, opacity: 0.6 }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
