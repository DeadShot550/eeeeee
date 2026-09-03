import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

/* ---------------- Button ---------------- */
type Variant = 'gold' | 'outline' | 'ghost' | 'danger' | 'navy' | 'soft';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}
const variants: Record<Variant, string> = {
  gold: 'bg-gold text-navy hover:bg-gold-light shadow-[0_8px_30px_-10px_rgba(201,169,97,0.6)]',
  outline: 'border border-gold/50 text-gold hover:bg-gold/10 hover:border-gold',
  ghost: 'text-current hover:bg-black/5',
  danger: 'bg-ruby/10 text-ruby border border-ruby/30 hover:bg-ruby hover:text-white',
  navy: 'bg-navy text-cream hover:bg-navy-3',
  soft: 'bg-navy/5 text-navy hover:bg-navy/10 border border-navy/10',
};
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };

export function Button({ variant = 'gold', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ---------------- Form fields ---------------- */
type Tone = 'dark' | 'light';
const inputBase = 'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:opacity-60';
const inputTone: Record<Tone, string> = {
  dark: 'bg-white/[0.04] border border-cream/15 text-cream placeholder:text-mist/60 focus:border-gold/70 focus:bg-white/[0.06] focus:ring-2 focus:ring-gold/15',
  light: 'bg-white border border-navy/15 text-navy placeholder:text-navy/35 focus:border-gold focus:ring-2 focus:ring-gold/20',
};

export function Field({ label, error, hint, children, tone = 'dark', className = '' }: { label?: string; error?: string; hint?: string; children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className={`block text-[11px] font-medium uppercase tracking-[0.18em] mb-1.5 ${tone === 'dark' ? 'text-gold/80' : 'text-navy/60'}`}>
          {label}
        </span>
      )}
      {children}
      {error ? <span className="block mt-1 text-xs text-ruby">{error}</span> : hint ? <span className={`block mt-1 text-xs ${tone === 'dark' ? 'text-mist' : 'text-navy/50'}`}>{hint}</span> : null}
    </label>
  );
}

export function Input({ tone = 'dark', className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { tone?: Tone }) {
  return <input className={`${inputBase} ${inputTone[tone]} ${className}`} {...props} />;
}
export function Select({ tone = 'dark', className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone }) {
  return (
    <select className={`${inputBase} ${inputTone[tone]} ${tone === 'dark' ? '[&>option]:bg-navy-2 [&>option]:text-cream' : ''} ${className}`} {...props}>
      {children}
    </select>
  );
}
export function Textarea({ tone = 'dark', className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone }) {
  return <textarea className={`${inputBase} ${inputTone[tone]} min-h-[100px] ${className}`} {...props} />;
}

/* ---------------- Badge ---------------- */
export type BadgeTone = 'gold' | 'emerald' | 'ruby' | 'amber' | 'mist' | 'navy';
const badgeTones: Record<BadgeTone, string> = {
  gold: 'bg-gold/15 text-gold-dark border-gold/30',
  emerald: 'bg-emerald/12 text-emerald border-emerald/30',
  ruby: 'bg-ruby/10 text-ruby border-ruby/30',
  amber: 'bg-amber/12 text-amber border-amber/30',
  mist: 'bg-mist/15 text-mist border-mist/30',
  navy: 'bg-navy/8 text-navy border-navy/15',
};
export function Badge({ tone = 'gold', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium uppercase tracking-wider ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; width?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${width} ledger rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden`}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-navy/10">
              <div>
                <h3 className="font-display text-2xl font-semibold text-navy leading-tight">{title}</h3>
                {subtitle && <p className="text-sm text-navy/60 mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-navy/5 text-navy/60" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto scroll-thin">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Misc ---------------- */
export function Spinner({ label, tone = 'dark' }: { label?: string; tone?: Tone }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-9 h-9 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
      {label && <p className={`text-xs uppercase tracking-[0.2em] ${tone === 'dark' ? 'text-mist' : 'text-navy/50'}`}>{label}</p>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-ruby/30 bg-ruby/5 p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-ruby font-medium">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs underline text-ruby/80 hover:text-ruby">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl border border-dashed border-navy/15">
      {icon && <div className="w-12 h-12 rounded-full bg-gold/10 text-gold-dark flex items-center justify-center mb-3">{icon}</div>}
      <p className="font-display text-xl text-navy">{title}</p>
      {hint && <p className="text-sm text-navy/55 mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, align = 'left', tone = 'dark' }: { eyebrow?: string; title: ReactNode; description?: string; align?: 'left' | 'center'; tone?: Tone }) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-2xl`}>
      {eyebrow && (
        <p className={`text-[11px] font-medium uppercase tracking-[0.3em] mb-4 ${tone === 'dark' ? 'text-gold' : 'text-gold-dark'}`}>
          <span className="inline-block w-8 h-px bg-current align-middle mr-3" />
          {eyebrow}
        </p>
      )}
      <h2 className={`font-display text-4xl md:text-5xl font-medium leading-[1.05] ${tone === 'dark' ? 'text-cream' : 'text-navy'}`}>{title}</h2>
      {description && <p className={`mt-5 text-base leading-relaxed ${tone === 'dark' ? 'text-mist' : 'text-navy/60'}`}>{description}</p>}
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <p className="text-sm text-navy/70 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'navy'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------- Toasts ---------------- */
interface Toast {
  id: number;
  title: string;
  desc?: string;
  tone?: 'success' | 'error' | 'info';
}
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald" />,
    error: <AlertCircle className="w-5 h-5 text-ruby" />,
    info: <Info className="w-5 h-5 text-gold" />,
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-navy-2 border border-gold/20 p-4 shadow-2xl"
            >
              {icons[t.tone || 'info']}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream">{t.title}</p>
                {t.desc && <p className="text-xs text-mist mt-0.5 break-words">{t.desc}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
