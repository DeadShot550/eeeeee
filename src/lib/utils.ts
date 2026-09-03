export function gradeFor(pct: number): { grade: string; label: string; tone: 'emerald' | 'gold' | 'amber' | 'ruby' } {
  if (pct >= 90) return { grade: 'A+', label: 'Outstanding', tone: 'emerald' };
  if (pct >= 80) return { grade: 'A', label: 'Excellent', tone: 'emerald' };
  if (pct >= 70) return { grade: 'B+', label: 'Very Good', tone: 'gold' };
  if (pct >= 60) return { grade: 'B', label: 'Good', tone: 'gold' };
  if (pct >= 50) return { grade: 'C', label: 'Satisfactory', tone: 'amber' };
  if (pct >= 40) return { grade: 'D', label: 'Needs Improvement', tone: 'amber' };
  return { grade: 'F', label: 'Unsatisfactory', tone: 'ruby' };
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const fmtMoney = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN');

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const PERIODS = [
  { n: 1, start: '08:00', end: '08:45' },
  { n: 2, start: '08:50', end: '09:35' },
  { n: 3, start: '09:40', end: '10:25' },
  { n: 4, start: '10:45', end: '11:30' },
  { n: 5, start: '11:35', end: '12:20' },
  { n: 6, start: '13:00', end: '13:45' },
  { n: 7, start: '13:50', end: '14:35' },
];

export const stageOf = (level: number) => {
  if (level <= 2) return 'Early Years';
  if (level <= 7) return 'Primary School';
  if (level <= 10) return 'Middle School';
  return 'Senior School';
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const GENDERS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
export const TERMS = ['Term I', 'Term II', 'Annual'];
