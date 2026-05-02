import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * P3-27: 컴포넌트 렌더 오류 시 앱 전체 크래시 방지
 * 오류가 발생한 하위 트리를 fallback UI로 대체
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // 실서비스에서는 Sentry 등 에러 리포팅 서비스로 전송
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div className="text-center max-w-sm w-full">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--bg-danger)' }}>
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              오류가 발생했습니다
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              일시적인 오류입니다. 새로고침 후 다시 시도해 주세요.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono mt-2 mb-4 px-3 py-2 rounded-lg text-left overflow-auto max-h-24"
                style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
