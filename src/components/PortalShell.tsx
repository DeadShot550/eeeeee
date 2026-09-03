import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X, Home } from 'lucide-react';
import Crest from './Crest';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface Props {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
  roleLabel: string;
  userName: string;
  userMeta?: string;
  onLogout: () => void;
  children: ReactNode;
}

export default function PortalShell({ items, active, onNav, roleLabel, userName, userMeta, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-3 px-6 pt-7 pb-6">
        <Crest size={40} />
        <div className="leading-none">
          <p className="font-display text-xl font-semibold text-cream">Aurelius</p>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gold mt-0.5">{roleLabel}</p>
        </div>
      </Link>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scroll-thin">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              onClick={() => {
                onNav(it.id);
                setOpen(false);
              }}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${isActive ? 'text-navy' : 'text-cream/70 hover:text-cream hover:bg-white/5'}`}
            >
              {isActive && <motion.span layoutId="portal-nav" className="absolute inset-0 bg-gold rounded-xl" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className="relative flex items-center gap-3 flex-1">
                <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{it.icon}</span>
                {it.label}
              </span>
              {it.badge ? <span className={`relative text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-navy text-gold' : 'bg-gold/20 text-gold'}`}>{it.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gold/15">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-display text-lg">{userName.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-cream truncate">{userName}</p>
            {userMeta && <p className="text-[10px] uppercase tracking-wider text-mist truncate">{userMeta}</p>}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/" className="flex-1 inline-flex items-center justify-center gap-2 text-xs text-cream/70 hover:text-cream border border-cream/10 rounded-lg py-2">
            <Home className="w-3.5 h-3.5" /> Website
          </Link>
          <button onClick={onLogout} className="flex-1 inline-flex items-center justify-center gap-2 text-xs text-ruby hover:text-white hover:bg-ruby border border-ruby/30 rounded-lg py-2 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ledger flex">
      <aside className="hidden lg:block w-64 shrink-0 bg-navy border-r border-gold/15 sticky top-0 h-screen">{Sidebar}</aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-navy border-b border-gold/15 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Crest size={30} />
          <p className="font-display text-lg text-cream">Aurelius · <span className="text-gold text-sm">{roleLabel}</span></p>
        </div>
        <button onClick={() => setOpen(true)} className="text-cream p-1" aria-label="Open menu">
          <Menu />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-ink/70" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-navy border-r border-gold/15">
              <button onClick={() => setOpen(false)} className="absolute top-5 right-4 text-cream/70" aria-label="Close">
                <X />
              </button>
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark">{eyebrow}</p>}
        <h1 className="font-display text-4xl text-navy mt-1 leading-tight">{title}</h1>
        {description && <p className="text-sm text-navy/60 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, accent = 'gold' }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: 'gold' | 'emerald' | 'ruby' | 'navy' | 'amber' }) {
  const accents = {
    gold: 'from-gold/20 to-gold/5 text-gold-dark',
    emerald: 'from-emerald/20 to-emerald/5 text-emerald',
    ruby: 'from-ruby/15 to-ruby/5 text-ruby',
    navy: 'from-navy/15 to-navy/5 text-navy',
    amber: 'from-amber/20 to-amber/5 text-amber',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl bg-white border border-navy/10 p-5 overflow-hidden shadow-[0_10px_30px_-20px_rgba(11,18,34,0.3)]">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-70`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-navy/50">{label}</p>
          <p className="font-display text-4xl text-navy mt-1">{value}</p>
          {hint && <p className="text-xs text-navy/50 mt-1">{hint}</p>}
        </div>
        {icon && <span className={`${accents[accent].split(' ').pop()} [&>svg]:w-5 [&>svg]:h-5`}>{icon}</span>}
      </div>
    </motion.div>
  );
}

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white border border-navy/10 shadow-[0_10px_30px_-20px_rgba(11,18,34,0.3)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          {title && <p className="font-display text-xl text-navy">{title}</p>}
          {action}
        </div>
      )}
      <div className={title || action ? 'px-5 pb-5' : 'p-5'}>{children}</div>
    </div>
  );
}
