import { Users, School, Inbox, CreditCard, Bell, ClipboardList, ArrowRight, UserPlus, Megaphone } from 'lucide-react';
import { PageHeader, StatCard, Card } from '../../components/PortalShell';
import { Badge, Button, ErrorBox, Spinner } from '../../components/ui';
import type { DashboardData } from '../../lib/types';
import { fmtDate, fmtMoney } from '../../lib/utils';
import { useResource } from './shared';

const tone = { pending: 'amber', approved: 'emerald', rejected: 'ruby' } as const;

export default function Dashboard({ go }: { go: (t: string) => void }) {
  const { data, loading, error, reload } = useResource<DashboardData>('/api/admin?resource=dashboard');
  if (loading) return <Spinner label="Loading dashboard" tone="light" />;
  if (error || !data) return <ErrorBox message={error || 'Failed to load'} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Good day, Registrar."
        description="A live view of the academy — admissions, scholars, accounts and the calendar."
        actions={
          <>
            <Button variant="navy" size="sm" onClick={() => go('students')} icon={<UserPlus className="w-4 h-4" />}>
              Add student
            </Button>
            <Button variant="soft" size="sm" onClick={() => go('notices')} icon={<Megaphone className="w-4 h-4" />}>
              Publish notice
            </Button>
          </>
        }
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Scholars enrolled" value={data.students} hint={`across ${data.classes} classes`} icon={<Users />} />
        <StatCard label="Pending admissions" value={data.pendingAdmissions} hint={`${data.approvedAdmissions} approved of ${data.totalAdmissions}`} icon={<Inbox />} accent="amber" />
        <StatCard label="Fees outstanding" value={fmtMoney(data.feesDue)} hint={`${fmtMoney(data.feesCollected)} collected`} icon={<CreditCard />} accent={data.feesDue ? 'ruby' : 'emerald'} />
        <StatCard label="Notices published" value={data.notices} hint={`${data.upcomingExams.length} exams ahead`} icon={<Bell />} accent="navy" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Card title="Recent applications" action={<button onClick={() => go('admissions')} className="text-xs text-gold-dark hover:underline inline-flex items-center gap-1">Review <ArrowRight className="w-3 h-3" /></button>} className="lg:col-span-2">
          {data.recentAdmissions.length === 0 ? (
            <p className="text-sm text-navy/50">No applications yet.</p>
          ) : (
            <ul className="divide-y divide-navy/8">
              {data.recentAdmissions.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-navy font-medium truncate">{a.applicant_name}</p>
                    <p className="text-xs text-navy/50 truncate">{a.class_name} · {a.guardian_name} · {fmtDate(a.created_at)}</p>
                  </div>
                  <Badge tone={tone[a.status]}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Examinations ahead" action={<button onClick={() => go('exams')} className="text-xs text-gold-dark hover:underline">Manage</button>}>
          {data.upcomingExams.length === 0 ? (
            <p className="text-sm text-navy/50">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingExams.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-9 h-9 rounded-xl bg-navy text-gold flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-navy font-medium truncate">{e.title}</p>
                    <p className="text-xs text-navy/50">{e.class_name} · {fmtDate(e.start_date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recently enrolled" action={<button onClick={() => go('students')} className="text-xs text-gold-dark hover:underline">All students</button>} className="mt-5">
        {data.recentStudents.length === 0 ? (
          <p className="text-sm text-navy/50">No students yet — add your first scholar.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.recentStudents.map((s) => (
              <div key={s.id} className="rounded-xl border border-navy/10 bg-paper p-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-navy text-gold font-display flex items-center justify-center">{s.full_name.charAt(0)}</span>
                <div className="min-w-0">
                  <p className="text-sm text-navy truncate">{s.full_name}</p>
                  <p className="text-[11px] text-navy/50 truncate">{s.class_name} · {s.admission_no}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 rounded-2xl bg-navy text-cream p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(201,169,97,0.25),transparent_60%)]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Quick actions</p>
          <p className="font-display text-2xl mt-1">Everything is under your control.</p>
        </div>
        <div className="relative flex flex-wrap gap-2">
          {[
            ['classes', 'Classes', <School key="c" className="w-4 h-4" />],
            ['syllabus', 'Syllabus', <ClipboardList key="s" className="w-4 h-4" />],
            ['results', 'Results', <Users key="r" className="w-4 h-4" />],
            ['fees', 'Fees', <CreditCard key="f" className="w-4 h-4" />],
          ].map(([id, label, icon]) => (
            <Button key={String(id)} variant="outline" size="sm" onClick={() => go(String(id))} icon={icon as React.ReactNode}>
              {label as string}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
