import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an operational rendering error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-white dark:bg-[#18181B] border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-sm text-center max-w-lg mx-auto space-y-4 animate-in fade-in duration-150">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-stone-100">
              {this.props.fallbackTitle || "Tampilan Komponen Terkendala"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Sistem telah mengisolasi kendala tampilan ini agar tidak memengaruhi navigasi modul lainnya.
            </p>
          </div>

          {this.state.error && (
            <details className="text-left text-[11px] bg-stone-50 dark:bg-stone-900/80 p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 overflow-auto max-h-36">
              <summary className="font-mono cursor-pointer font-semibold text-amber-700 dark:text-amber-400 select-none">
                Detail Teknis Kendala ({this.state.error.name || "Error"})
              </summary>
              <pre className="mt-2 text-[10px] font-mono whitespace-pre-wrap break-all text-red-600 dark:text-red-400">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 mx-auto hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
