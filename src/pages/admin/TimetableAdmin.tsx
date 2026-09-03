import { useEffect, useMemo, useState } from 'react';
import { Save, Eraser } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Button, ErrorBox, Spinner, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { SchoolClass, Syllabus, TimetableEntry } from '../../lib/types';
import { DAYS, PERIODS } from '../../lib/utils';
import { useResource } from './shared';

type Grid = Record<string, { subject: string; teacher: string }>;
const key = (d: string, p: number) => `${d}-${p}`;

export default function TimetableAdmin() {
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [classId, setClassId] = useState('');
  useEffect(() => {
    if (!classId && classes.data?.length) setClassId(String(classes.data[0].id));
  }, [classes.data, classId]);
  const tt = useResource<TimetableEntry[]>(`/api/admin?resource=timetable&class_id=${classId}`, !!classId);
  const syl = useResource<Syllabus[]>(`/api/admin?resource=syllabus&class_id=${classId}`, !!classId);
  const [grid, setGrid] = useState<Grid>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const g: Grid = {};
    (tt.data || []).forEach((e) => (g[key(e.day, e.period)] = { subject: e.subject, teacher: e.teacher }));
    setGrid(g);
    setDirty(false);
  }, [tt.data]);

  const subjects = useMemo(() => Array.from(new Set((syl.data || []).map((s) => s.subject))).sort(), [syl.data]);
  const cls = classes.data?.find((c) => String(c.id) === classId);

  const update = (k: string, field: 'subject' | 'teacher', v: string) => {
    setGrid((g) => ({ ...g, [k]: { subject: g[k]?.subject || '', teacher: g[k]?.teacher || '', [field]: v } }));
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const entries = DAYS.flatMap((d) => PERIODS.map((p) => ({ day: d, period: p.n, subject: grid[key(d, p.n)]?.subject || '', teacher: grid[key(d, p.n)]?.teacher || '', start_time: p.start, end_time: p.end })));
      await api('/api/admin?resource=timetable&action=bulk', { method: 'POST', body: { class_id: Number(classId), entries } });
      toast.push({ title: `Timetable saved for ${cls?.name}`, tone: 'success' });
      await tt.reload();
    } catch (e) {
      toast.push({ title: 'Save failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Scheduling"
        title="Timetable"
        description="Fill the weekly grid per class. Type a subject in each cell and, optionally, the teacher."
        actions={
          <>
            <Button variant="soft" onClick={() => { setGrid({}); setDirty(true); }} icon={<Eraser className="w-4 h-4" />}>Clear</Button>
            <Button variant="navy" onClick={save} loading={busy} disabled={!dirty || !classId} icon={<Save className="w-4 h-4" />}>Save timetable</Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {classes.data?.map((c) => (
          <button key={c.id} onClick={() => setClassId(String(c.id))} className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${String(c.id) === classId ? 'bg-navy text-gold border-navy' : 'border-navy/15 text-navy/60 hover:border-navy/40'}`}>
            {c.name}
          </button>
        ))}
      </div>
      {subjects.length > 0 && (
        <p className="text-xs text-navy/50 mb-3">Subjects in {cls?.name} syllabus: {subjects.join(' · ')}</p>
      )}
      {tt.loading || classes.loading ? (
        <Spinner label="Loading timetable" tone="light" />
      ) : tt.error ? (
        <ErrorBox message={tt.error} onRetry={tt.reload} />
      ) : (
        <div className="rounded-2xl bg-white border border-navy/10 overflow-x-auto scroll-thin">
          <datalist id="subject-list">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-navy text-cream">
                <th className="text-left px-3 py-3 text-[10px] uppercase tracking-[0.2em] font-medium w-28">Period</th>
                {DAYS.map((d) => <th key={d} className="text-left px-3 py-3 text-[10px] uppercase tracking-[0.2em] font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p, i) => (
                <tr key={p.n} className={`border-t border-navy/8 ${i === 3 || i === 5 ? 'border-t-2 border-t-gold/40' : ''}`}>
                  <td className="px-3 py-2 text-xs text-navy/60"><span className="font-display text-lg text-navy">{p.n}</span><br />{p.start}–{p.end}</td>
                  {DAYS.map((d) => {
                    const k = key(d, p.n);
                    return (
                      <td key={d} className="px-2 py-2">
                        <input list="subject-list" value={grid[k]?.subject || ''} onChange={(e) => update(k, 'subject', e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-navy/10 bg-paper px-2.5 py-1.5 text-sm text-navy outline-none focus:border-gold" />
                        <input value={grid[k]?.teacher || ''} onChange={(e) => update(k, 'teacher', e.target.value)} placeholder="Teacher" className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-2.5 py-1 text-xs text-navy/70 outline-none focus:border-navy/15 focus:bg-paper" />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
