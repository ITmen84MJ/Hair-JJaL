import { useState, useRef, useCallback } from 'react';

interface SpeechOptions {
  onResult: (text: string) => void;
  onError?: (code: string) => void;
}

export function useSpeechRecognition({ onResult, onError }: SpeechOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(async () => {
    if (!supported) {
      onError?.('not-supported');
      return;
    }

    // ① 마이크 권한을 먼저 명시적으로 요청
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: unknown) {
      const name = (err as DOMException).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        onError?.('not-allowed');
      } else {
        onError?.('mic-error');
      }
      return;
    }

    // ② SpeechRecognition 시작
    const SR: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { onError?.('not-supported'); return; }

    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => { setIsListening(false); setInterimText(''); };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setInterimText('');
      if (e.error === 'not-allowed') {
        onError?.('not-allowed');
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        onError?.(`speech-error:${e.error}`);
      }
    };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) onResult(final);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, onResult, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return { isListening, interimText, supported, start, stop };
}
