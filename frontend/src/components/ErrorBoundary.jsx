import { Component } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { i18n } from '../i18n';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('Page error:', error);
  }

  render() {
    const t = i18n.t.bind(i18n);
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t('Something went wrong on this page.')}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t("Don’t worry — nothing was lost. Try reloading the page, or head back to the dashboard.")}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              className="btn-primary"
              onClick={() => this.setState({ hasError: false })}
            >
              <RotateCcw className="h-4 w-4" />
              {t('Try again')}
            </button>
            <button className="btn-secondary" onClick={() => { window.location.href = '/dashboard'; }}>
              <ArrowLeft className="h-4 w-4" />
              {t('Go to Dashboard')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
