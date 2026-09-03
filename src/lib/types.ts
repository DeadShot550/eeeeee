export interface SchoolClass {
  id: number;
  name: string;
  level: number;
  section: string;
  teacher: string;
  room: string;
  capacity: number;
  description: string;
  age_range: string;
  annual_fee: number;
  student_count?: number;
}

export interface Student {
  id: number;
  admission_no: string;
  full_name: string;
  username: string;
  password?: string;
  class_id: number;
  roll_no: number;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  dob: string;
  gender: string;
  blood_group: string;
  status: string;
  created_at: string;
  class?: SchoolClass | null;
  class_name?: string;
}

export type AdmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Admission {
  id: number;
  application_no: string;
  applicant_name: string;
  dob: string;
  gender: string;
  applying_class_id: number;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  address?: string;
  previous_school: string;
  notes?: string;
  status: AdmissionStatus;
  review_note: string;
  student_id: number | null;
  created_at: string;
  reviewed_at: string | null;
  class_name?: string;
}

export interface Syllabus {
  id: number;
  class_id: number;
  subject: string;
  term: string;
  topics: string[];
  description: string;
}

export interface Exam {
  id: number;
  title: string;
  term: string;
  start_date: string;
  end_date: string;
  class_id: number | null;
  description: string;
  class_name?: string;
}

export interface Result {
  id: number;
  exam_id: number;
  student_id: number;
  subject: string;
  max_marks: number;
  marks_obtained: number;
  remarks: string;
}

export interface Notice {
  id: number;
  title: string;
  body: string;
  audience: string;
  class_id: number | null;
  pinned: boolean;
  created_at: string;
}

export interface Fee {
  id: number;
  student_id: number;
  title: string;
  amount: number;
  due_date: string | null;
  status: 'due' | 'paid';
  paid_at: string | null;
  student_name?: string;
  admission_no?: string;
  class_id?: number | null;
  class_name?: string;
}

export interface TimetableEntry {
  id: number;
  class_id: number;
  day: string;
  period: number;
  subject: string;
  start_time: string;
  end_time: string;
  teacher: string;
}

export interface Faculty {
  id: number;
  name: string;
  title: string;
  department: string;
  qualifications: string;
  bio: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
}

export interface PublicData {
  classes: SchoolClass[];
  faculty: Faculty[];
  testimonials: Testimonial[];
  notices: Notice[];
  exams: Exam[];
  stats: { students: number; classes: number; faculty: number; founded: number };
}

export interface StudentBundle {
  student: Student;
  syllabus: Syllabus[];
  timetable: TimetableEntry[];
  exams: Exam[];
  results: Result[];
  fees: Fee[];
  notices: Notice[];
}

export interface DashboardData {
  students: number;
  classes: number;
  pendingAdmissions: number;
  totalAdmissions: number;
  approvedAdmissions: number;
  upcomingExams: Exam[];
  feesDue: number;
  feesCollected: number;
  notices: number;
  recentAdmissions: Admission[];
  recentStudents: Student[];
}
