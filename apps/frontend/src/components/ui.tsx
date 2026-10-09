import React from 'react';

// Typography
export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
  </div>
);

// Card (Industrial style: sharp corners, thin borders, very subtle shadow)
export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
    <h3 className="font-medium text-slate-800">{title}</h3>
    {action && <div>{action}</div>}
  </div>
);

// Button
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' };
export const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonProps) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 border border-transparent",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm",
    accent: "bg-amber-600 text-white hover:bg-amber-700 border border-transparent shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

// Badge
export const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) => {
  const base = "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border";
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };
  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
};

// Form Label & Input
export const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-shadow ${className}`} {...props} />
));
Input.displayName = 'Input';

// Table
export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full text-sm text-left whitespace-nowrap">{children}</table>
  </div>
);

export const Th = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-5 py-3 font-medium text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-xs ${className}`}>{children}</th>
);

export const Td = ({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-5 py-3 border-b border-slate-100 text-slate-700 ${className}`} {...props}>{children}</td>
);
