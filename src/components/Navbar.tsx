import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import Crest from './Crest';
import { useAuth } from '../lib/auth';

const links = [
  { label: 'About', href: '/#about' },
  { label: 'Academics', href: '/#academics' },
  { label: 'Campus', href: '/#campus' },
  { label: 'Faculty', href: '/#faculty' },
  { label: 'Notices', href: '/#notices' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  const go = (href: string) => {
    setOpen(false);
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      if (loc.pathname !== '/') {
        nav('/');
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else nav(href);
  };

  const portalHref = role === 'admin' ? '/admin' : '/student';

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-navy/80 backdrop-blur-xl border-b border-gold/15 py-3' : 'py-5'}`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Crest size={42} className="transition-transform duration-500 group-hover:rotate-[15deg]" />
          <div className="leading-none">
            <p className="font-display text-2xl font-semibold tracking-wide text-cream">Aurelius</p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-gold">Academy · Est. 1924</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <button key={l.label} onClick={() => go(l.href)} className="text-[13px] uppercase tracking-[0.18em] text-cream/75 hover:text-gold transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <Link to={portalHref} className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.15em] text-gold hover:text-gold-light px-4 py-2">
              <LayoutDashboard className="w-4 h-4" /> {role === 'admin' ? 'Admin Console' : 'My Portal'}
            </Link>
          ) : (
            <Link to="/login" className="text-[13px] uppercase tracking-[0.15em] text-cream/80 hover:text-gold px-4 py-2 transition-colors">
              Portal Login
            </Link>
          )}
          <Link to="/admissions" className="inline-flex items-center gap-2 bg-gold text-navy text-[13px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 rounded-full hover:bg-gold-light transition-all shadow-[0_8px_30px_-10px_rgba(201,169,97,0.7)]">
            Admissions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button className="lg:hidden p-2 text-cream" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-navy/95 backdrop-blur-xl border-t border-gold/10"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {links.map((l) => (
                <button key={l.label} onClick={() => go(l.href)} className="text-left text-sm uppercase tracking-[0.2em] text-cream/80 py-1">
                  {l.label}
                </button>
              ))}
              <div className="h-px bg-gold/15 my-2" />
              <Link to={user ? portalHref : '/login'} className="text-sm uppercase tracking-[0.2em] text-gold">
                {user ? (role === 'admin' ? 'Admin Console' : 'My Portal') : 'Portal Login'}
              </Link>
              <Link to="/admissions" className="inline-flex w-fit items-center gap-2 bg-gold text-navy text-sm font-medium uppercase tracking-[0.15em] px-5 py-2.5 rounded-full">
                Admissions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
