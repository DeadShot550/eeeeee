import supabase from './db-client.js';
import { cors, requireRole, stripPassword } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const session = await requireRole(req, res, 'student');
    if (!session) return;

    const { data: student } = await supabase.from('students').select('*').eq('id', session.student_id).maybeSingle();
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    if (req.method === 'GET') {
      const [cls, syllabus, timetable, exams, results, fees, notices] = await Promise.all([
        supabase.from('classes').select('*').eq('id', student.class_id).maybeSingle(),
        supabase.from('syllabus').select('*').eq('class_id', student.class_id).order('subject', { ascending: true }),
        supabase.from('timetable').select('*').eq('class_id', student.class_id).order('period', { ascending: true }),
        supabase.from('exams').select('*').or(`class_id.is.null,class_id.eq.${student.class_id}`).order('start_date', { ascending: true }),
        supabase.from('results').select('*').eq('student_id', student.id).order('id', { ascending: true }),
        supabase.from('fees').select('*').eq('student_id', student.id).order('due_date', { ascending: true }),
        supabase.from('notices').select('*').or(`audience.eq.all,audience.eq.students,class_id.eq.${student.class_id}`).order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      ]);
      return res.status(200).json({
        student: { ...stripPassword(student), class: cls.data || null },
        syllabus: syllabus.data || [],
        timetable: timetable.data || [],
        exams: exams.data || [],
        results: results.data || [],
        fees: fees.data || [],
        notices: notices.data || [],
      });
    }

    if (req.method === 'POST') {
      const { action, fee_id } = req.body || {};
      if (action === 'pay-fee') {
        const { data: fee } = await supabase.from('fees').select('*').eq('id', fee_id).eq('student_id', student.id).maybeSingle();
        if (!fee) return res.status(404).json({ error: 'Fee record not found.' });
        if (fee.status === 'paid') return res.status(400).json({ error: 'This fee is already paid.' });
        const { data, error } = await supabase
          .from('fees')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', fee.id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('student error', err);
    return res.status(500).json({ error: err.message });
  }
}
