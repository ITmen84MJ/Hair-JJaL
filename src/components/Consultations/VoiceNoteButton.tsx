import { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X, Settings } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface Props {
  onAppend: (text: string) => void;
  /** true이면 아이콘만 표시 (라벨 옆 인라인 배치용) */
  compact?: boolean;
}

// 에러 코드 → 사용자 메시지 매핑
function getErrorMessage(code: string): { title: string; hint: string; canRetry: boolean } {
  if (code === 'not-allowed') {
    return {
      title: '마이크 권한이 필요합니다',
      hint: '브라우저 주소창 왼쪽 🔒 아이콘 → 마이크 → 허용 후 다시 시도해주세요.',
      canRetry: true,
    };
  }
  if (code === 'not-supported') {
    return {
      title: '이 브라우저는 음성 인식을 지원하지 않습니다',
      hint: 'Chrome 또는 Edge를 사용해주세요.',
      canRetry: false,
    };
  }
  if (code === 'mic-error') {
    return {
      title: '마이크를 사용할 수 없습니다',
      hint: '다른 앱이 마이크를 점유 중인지 확인해주세요.',
      canRetry: true,
    };
  }
  // speech-error:xxx
  return {
    title: '음성 인식 중 오류가 발생했습니다',
    hint: '잠시 후 다시 시도해주세요.',
    canRetry: true,
  };
}

export function VoiceNoteButton({ onAppend, compact = false }: Props) {
  const [errorCode, setErrorCode] = useState('');

  const { isListening, interimText, supported, start, stop } = useSpeechRecognition({
    onResult: (text) => {
      setErrorCode('');
      onAppend(text + ' ');
    },
    onError: setErrorCode,
  });

  // 오류 메시지 5초 후 자동 해제 (not-allowed 제외 — 사용자가 직접 닫아야 함)
  useEffect(() => {
    if (!errorCode || errorCode === 'not-allowed' || errorCode === 'not-supported') return;
    const t = setTimeout(() => setErrorCode(''), 5000);
    return () => clearTimeout(t);
  }, [errorCode]);

  if (!supported) return null;

  const handleClick = () => {
    setErrorCode('');
    if (isListening) stop();
    else start();
  };

  const err = errorCode ? getErrorMessage(errorCode) : null;

  // compact: 아이콘 전용 버튼 (라벨 행 인라인 배치용)
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleClick}
          aria-label={isListening ? '음성 입력 중지' : '음성으로 입력'}
          title={isListening ? '음성 입력 중지' : '음성으로 입력'}
          className={`p-1 rounded transition-colors ${
            isListening
              ? 'text-red-500 animate-pulse'
              : 'hover:text-rose-500'
          }`}
          style={{ color: isListening ? undefined : 'var(--text-muted)' }}
        >
          {isListening ? <MicOff size={13} /> : <Mic size={13} />}
        </button>
        {isListening && interimText && (
          <span className="text-[10px] italic truncate max-w-[80px]"
            style={{ color: 'var(--text-muted)' }}>
            {interimText}...
          </span>
        )}
        {err && (
          <span className="text-[10px]" style={{ color: 'var(--text-warning)' }} title={err.hint}>
            {err.title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
          }`}
        >
          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          {isListening ? '녹음 중지' : '음성으로 기록'}
        </button>

        {isListening && interimText && (
          <span className="text-xs italic px-2 py-1 rounded-md max-w-xs truncate"
            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            {interimText}...
          </span>
        )}
      </div>

      {/* 권한 오류 안내 박스 */}
      {err && (
        <div className="rounded-xl border px-3 py-2.5 flex gap-2"
          style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-warning)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-warning-2)' }}>{err.title}</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-warning)' }}>{err.hint}</p>
            {err.canRetry && (
              <button
                type="button"
                onClick={handleClick}
                className="mt-1.5 text-xs font-medium underline underline-offset-2"
                style={{ color: 'var(--text-warning-2)' }}
              >
                다시 시도하기
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setErrorCode('')}
            className="flex-shrink-0 mt-0.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-warning)' }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
