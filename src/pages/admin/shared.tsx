import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Copy, KeyRound, Search } from 'lucide-react';
import { Button, Modal, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';

export function useResource<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, reload: load, setData };
}

export interface Credentials {
  username: string;
  password: string;
  admission_no?: string;
  full_name?: string;
}

export function CredentialsModal({ creds, onClose, title = 'Student login created' }: { creds: Credentials | null; onClose: () => void; title?: string }) {
  const toast = useToast();
  const copy = (t: string) => {
    navigator.clipboard?.writeText(t);
    toast.push({ title: 'Copied', tone: 'success' });
  };
  return (
    <Modal open={!!creds} onClose={onClose} title={title} subtitle="Share these credentials with the parent or guardian. The student can change the password from their portal." width="max-w-md">
      {creds && (
        <div className="space-y-3">
          {creds.full_name && <p className="text-sm text-navy/70">Scholar: <span className="text-navy font-medium">{creds.full_name}</span></p>}
          {[
            ['Username', creds.username],
            ['Password', creds.password],
            ...(creds.admission_no ? [['Admission No.', creds.admission_no]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-navy/10 bg-paper px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-navy/50">{k}</p>
                <p className="font-mono text-navy text-lg">{v}</p>
              </div>
              <button onClick={() => copy(v)} className="p-2 rounded-full hover:bg-navy/5 text-navy/60" aria-label={`Copy ${k}`}>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="navy" onClick={onClose} icon={<KeyRound className="w-4 h-4" />}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search…'} className="w-full sm:w-72 rounded-xl bg-white border border-navy/15 text-navy pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-navy/35" />
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-navy/10 overflow-x-auto scroll-thin">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-paper">
            {head.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-navy/50 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/8">{children}</tbody>
      </table>
    </div>
  );
}

export const td = 'px-4 py-3 align-middle text-navy';

export function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-colors ${active ? 'bg-navy text-gold border-navy' : 'border-navy/15 text-navy/60 hover:border-navy/40'}`}>
      {children}
    </button>
  );
}

export function IconBtn({ onClick, title, children, tone = 'navy' }: { onClick: () => void; title: string; children: ReactNode; tone?: 'navy' | 'ruby' | 'gold' }) {
  const tones = { navy: 'text-navy/60 hover:text-navy hover:bg-navy/5', ruby: 'text-ruby/70 hover:text-ruby hover:bg-ruby/10', gold: 'text-gold-dark hover:bg-gold/15' };
  return (
    <button onClick={onClick} title={title} aria-label={title} className={`p-2 rounded-lg transition-colors [&>svg]:w-4 [&>svg]:h-4 ${tones[tone]}`}>
      {children}
    </button>
  );
}
