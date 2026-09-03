import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Inbox, Users, School, BookOpen, CalendarDays, ClipboardList, Award, CreditCard, Bell, Globe } from 'lucide-react';
import PortalShell from '../../components/PortalShell';
import { useAuth, type AdminUser } from '../../lib/auth';
import { api } from '../../lib/api';
import Dashboard from './Dashboard';
import AdmissionsAdmin from './AdmissionsAdmin';
import StudentsAdmin from './StudentsAdmin';
import ClassesAdmin from './ClassesAdmin';
import SyllabusAdmin from './SyllabusAdmin';
import TimetableAdmin from './TimetableAdmin';
import ExamsAdmin from './ExamsAdmin';
import ResultsAdmin from './ResultsAdmin';
import FeesAdmin from './FeesAdmin';
import NoticesAdmin from './NoticesAdmin';
import WebsiteAdmin from './WebsiteAdmin';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { id: 'admissions', label: 'Admissions', icon: <Inbox /> },
  { id: 'students', label: 'Students', icon: <Users /> },
  { id: 'classes', label: 'Classes', icon: <School /> },
  { id: 'syllabus', label: 'Syllabus', icon: <BookOpen /> },
  { id: 'timetable', label: 'Timetable', icon: <CalendarDays /> },
  { id: 'exams', label: 'Examinations', icon: <ClipboardList /> },
  { id: 'results', label: 'Results', icon: <Award /> },
  { id: 'fees', label: 'Fees', icon: <CreditCard /> },
  { id: 'notices', label: 'Notices', icon: <Bell /> },
  { id: 'website', label: 'Website', icon: <Globe /> },
];

export default function AdminConsole() {
  const { tab = 'dashboard' } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    api<{ pendingAdmissions: number }>('/api/admin?resource=dashboard')
      .then((d) => setPending(d.pendingAdmissions))
      .catch(() => {});
  }, [tab]);

  const go = (id: string) => nav(`/admin/${id}`);
  const admin = auth.user as AdminUser | null;

  return (
    <PortalShell
      items={NAV.map((n) => (n.id === 'admissions' && pending ? { ...n, badge: pending } : n))}
      active={tab}
      onNav={go}
      roleLabel="Administration"
      userName={admin?.name || 'Administrator'}
      userMeta={admin?.username}
      onLogout={async () => {
        await auth.logout();
        nav('/login?as=admin');
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          {tab === 'dashboard' && <Dashboard go={go} />}
          {tab === 'admissions' && <AdmissionsAdmin />}
          {tab === 'students' && <StudentsAdmin />}
          {tab === 'classes' && <ClassesAdmin />}
          {tab === 'syllabus' && <SyllabusAdmin />}
          {tab === 'timetable' && <TimetableAdmin />}
          {tab === 'exams' && <ExamsAdmin />}
          {tab === 'results' && <ResultsAdmin />}
          {tab === 'fees' && <FeesAdmin />}
          {tab === 'notices' && <NoticesAdmin />}
          {tab === 'website' && <WebsiteAdmin />}
        </motion.div>
      </AnimatePresence>
    </PortalShell>
  );
}
