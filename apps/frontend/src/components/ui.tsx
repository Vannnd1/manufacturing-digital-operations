import React from 'react';

// Typography
export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-semibold text-slate-900 dark:text-stone-100 tracking-tight">{title}</h1>
    {description && <p className="text-sm text-slate-500 dark:text-stone-400 mt-1">{description}</p>}
  </div>
);

// Card (Modern Industrial: Soft rounded corners, subtle warm border, clean depth)
export const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-xs transition-shadow text-slate-800 dark:text-stone-100 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/80 flex justify-between items-center bg-stone-50/40 dark:bg-stone-900/60">
    <h3 className="font-semibold text-slate-800 dark:text-stone-100 text-sm tracking-tight">{title}</h3>
    {action && <div>{action}</div>}
  </div>
);

// Button (Pill and rounded modern styling)
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' };
export const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonProps) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants = {
    primary: "bg-slate-900 dark:bg-amber-600 text-white hover:bg-slate-800 dark:hover:bg-amber-500 shadow-xs",
    secondary: "bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 border border-slate-200 dark:border-stone-700 shadow-xs",
    accent: "bg-amber-600 text-white hover:bg-amber-700 shadow-xs",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-xs",
    ghost: "bg-transparent text-slate-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-slate-900 dark:hover:text-stone-100",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

// Badge (Rounded Pill Badges)
export const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info'; className?: string }) => {
  const base = "inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border";
  const variants = {
    default: "bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-700",
    success: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
    warning: "bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
    error: "bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/80",
    info: "bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/80",
  };
  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
};

// Form Label & Input
export const Label = ({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5 ${className}`}>{children}</label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`w-full px-3.5 py-2 border border-slate-300 dark:border-stone-700 rounded-xl bg-white dark:bg-[#141519] text-sm text-slate-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:focus:ring-amber-500/20 focus:border-slate-800 dark:focus:border-amber-500 transition-all ${className}`} {...props} />
));
Input.displayName = 'Input';

// Table
export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full text-sm text-left whitespace-nowrap text-slate-800 dark:text-stone-200">{children}</table>
  </div>
);

export const Th = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-5 py-3 font-medium text-slate-500 dark:text-stone-400 bg-slate-50 dark:bg-stone-900/80 border-b border-slate-200 dark:border-stone-800 uppercase tracking-wider text-xs ${className}`}>{children}</th>
);

export const Td = ({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-5 py-3 border-b border-slate-100 dark:border-stone-800/80 text-slate-700 dark:text-stone-300 ${className}`} {...props}>{children}</td>
);

// ── Industrial Visual Primitives ──────────────────────────

// Stock Level Progress Bar (vs Reorder Threshold)
interface StockLevelBarProps {
  current: number;
  threshold: number;
  unit?: string;
  className?: string;
  showLabels?: boolean;
}

export const StockLevelBar = ({
  current,
  threshold,
  unit = '',
  className = '',
  showLabels = true,
}: StockLevelBarProps) => {
  const curr = Math.max(0, Number(current) || 0);
  const min = Math.max(0, Number(threshold) || 0);
  const maxScale = min > 0 ? Math.max(curr, min * 1.8) : Math.max(curr, 10);
  const percent = Math.min(100, Math.round((curr / maxScale) * 100));
  const thresholdPercent = min > 0 ? Math.min(100, Math.round((min / maxScale) * 100)) : 50;

  const isCritical = min > 0 && curr < min;
  const isWarning = min > 0 && curr >= min && curr < min * 1.3;
  const barColor = isCritical
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className={`flex flex-col gap-1 min-w-[130px] ${className}`}>
      <div className="relative w-full h-2 bg-slate-100 dark:bg-stone-800 overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
        {min > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-500 dark:bg-stone-400 z-10 shadow-sm"
            style={{ left: `${thresholdPercent}%` }}
            title={`Threshold: ${min} ${unit}`}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-stone-400">
          <span className={isCritical ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-700 dark:text-stone-300"}>
            {curr} {unit}
          </span>
          <span className="text-slate-400 dark:text-stone-500">
            min {min}
          </span>
        </div>
      )}
    </div>
  );
};

// Route Step Pipeline (Connected dots for operational workflow)
export interface RouteStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
}

interface RoutePipelineProps {
  steps: RouteStep[];
  className?: string;
}

export const RoutePipeline = ({ steps, className = '' }: RoutePipelineProps) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center group relative">
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950 text-white animate-pulse'
                    : 'bg-white dark:bg-stone-800 border-2 border-slate-300 dark:border-stone-600'
                }`}
                title={`${step.name} (${step.status})`}
              >
                {isCompleted && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="2.5 6 4.5 8 9.5 3" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${
                isCurrent ? 'font-bold text-blue-700 dark:text-blue-400' : isCompleted ? 'text-slate-600 dark:text-stone-400' : 'text-slate-400 dark:text-stone-500'
              }`}>
                {step.name}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`w-3.5 h-0.5 mb-3 transition-colors ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-stone-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Semicircular Industrial Gauge Meter
interface GaugeMeterProps {
  value: number; // 0 - 100
  title: string;
  target?: number;
  subtitle?: string;
  className?: string;
}

export const GaugeMeter = ({ value, title, target = 95, subtitle, className = '' }: GaugeMeterProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const radius = 52;
  const arcLength = Math.PI * radius; // ~163.36
  const strokeDashoffset = arcLength * (1 - clamped / 100);

  // Status colors: >= target: Emerald green (#059669), >= target - 10: Warm Amber (#D97706), else: Crimson (#DC2626)
  const color = clamped >= target ? '#059669' : clamped >= target - 10 ? '#d97706' : '#dc2626';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative w-48 h-28 flex items-end justify-center">
        <svg 
          className="w-48 h-28 overflow-visible" 
          viewBox="0 0 130 75"
        >
          {/* Background track arc (180 degrees semicircle) */}
          <path
            d="M 13,65 A 52,52 0 0,1 117,65"
            fill="none"
            className="stroke-slate-200 dark:stroke-stone-800"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Target indicator tick (if specified) */}
          {target > 0 && target < 100 && (() => {
            const angle = Math.PI * (1 - target / 100);
            const tx1 = 65 + 46 * Math.cos(angle);
            const ty1 = 65 - 46 * Math.sin(angle);
            const tx2 = 65 + 58 * Math.cos(angle);
            const ty2 = 65 - 58 * Math.sin(angle);
            return (
              <line
                key="target-tick"
                x1={tx1}
                y1={ty1}
                x2={tx2}
                y2={ty2}
                className="stroke-slate-400 dark:stroke-stone-600"
                strokeWidth="2"
                strokeDasharray="2 1"
              />
            );
          })()}

          {/* Active progress arc */}
          <path
            d="M 13,65 A 52,52 0 0,1 117,65"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.4s ease" }}
          />
        </svg>

        {/* Center numerical readout & title */}
        <div className="absolute bottom-1.5 flex flex-col items-center text-center">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100 leading-none">
            {clamped}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-stone-400 font-semibold mt-1">
            {title}
          </span>
        </div>
      </div>

      {/* Subtitle / breakdown label */}
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-stone-500 mt-2.5 text-center font-medium max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  );
};


