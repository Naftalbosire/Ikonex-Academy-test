import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';

export default function AssessmentsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', subject_id: '', class_stream_id: '', academic_year: '2024', term: 'Term 1', exam_score: '', ca_score: '' });
  const [streamFilter, setStreamFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const { data: streams } = useQuery({ queryKey: ['streams'], queryFn: () => api.get('/streams') });
  const { data: allStudents } = useQuery({ queryKey: ['students', streamFilter], queryFn: () => api.get(`/students${streamFilter ? `?stream_id=${streamFilter}` : ''}`), });
  const { data: streamSubjects } = useQuery({
    queryKey: ['stream-subjects', form.class_stream_id],
    queryFn: () => api.get(`/streams/${form.class_stream_id}`),
    enabled: !!form.class_stream_id,
  });
  const { data: allSubjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });
  const { data, isLoading } = useQuery({
    queryKey: ['assessments', streamFilter, studentFilter, subjectFilter],
    queryFn: () => api.get(`/assessments?${new URLSearchParams({ ...(streamFilter && { stream_id: streamFilter }), ...(studentFilter && { student_id: studentFilter }), ...(subjectFilter && { subject_id: subjectFilter }) })}`),
  });

  const save = useMutation({
    mutationFn: (d) => api.post('/assessments', d),
    onSuccess: () => { qc.invalidateQueries(['assessments']); toast.success('Score recorded'); setModal(false); },
    onError: (e) => toast.error(e.message || 'Error'),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/assessments/${id}`),
    onSuccess: () => { qc.invalidateQueries(['assessments']); toast.success('Record deleted'); },
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const modalSubjects = streamSubjects?.data?.subjects || [];
  const modalStudents = streamSubjects ? (allStudents?.data?.filter(s => s.class_stream_id == form.class_stream_id) || []) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Assessments</h1><p className="text-gray-500 text-sm mt-1">Record and manage student scores</p></div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Record Score</button>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label text-xs">Filter by Stream</label>
            <select className="input" value={streamFilter} onChange={e => { setStreamFilter(e.target.value); setStudentFilter(''); }}>
              <option value="">All Streams</option>
              {streams?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Filter by Student</label>
            <select className="input" value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
              <option value="">All Students</option>
              {allStudents?.data?.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Filter by Subject</label>
            <select className="input" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {allSubjects?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Subject', 'Exam', 'CA', 'Total', 'Grade', 'Term', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(a => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{a.first_name} {a.last_name}</td>
                  <td className="py-2.5 px-3 text-gray-500">{a.subject_name}</td>
                  <td className="py-2.5 px-3">{a.exam_score}</td>
                  <td className="py-2.5 px-3">{a.ca_score}</td>
                  <td className="py-2.5 px-3 font-semibold">{a.total_score}</td>
                  <td className="py-2.5 px-3"><span className={`badge ${a.grade === 'A' ? 'bg-emerald-50 text-emerald-700' : a.grade === 'F' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>{a.grade || '-'}</span></td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{a.term}</td>
                  <td className="py-2.5 px-3">
                    <button className="btn-danger text-xs py-1 px-2" onClick={() => { if(confirm('Delete?')) del.mutate(a.id); }}><Trash2 size={11} /></button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No assessments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Student Score" size="md">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Academic Year</label>
              <input className="input" value={form.academic_year} onChange={set('academic_year')} />
            </div>
            <div>
              <label className="label">Term</label>
              <select className="input" value={form.term} onChange={set('term')}>
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Class Stream *</label>
            <select className="input" value={form.class_stream_id} onChange={set('class_stream_id')} required>
              <option value="">-- Select Stream --</option>
              {streams?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Student *</label>
            <select className="input" value={form.student_id} onChange={set('student_id')} required disabled={!form.class_stream_id}>
              <option value="">-- Select Student --</option>
              {(allStudents?.data?.filter(s => !form.class_stream_id || s.class_stream_id == form.class_stream_id) || []).map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subject *</label>
            <select className="input" value={form.subject_id} onChange={set('subject_id')} required disabled={!form.class_stream_id}>
              <option value="">-- Select Subject --</option>
              {(form.class_stream_id ? modalSubjects : allSubjects?.data || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Exam Score</label>
              <input type="number" className="input" value={form.exam_score} onChange={set('exam_score')} min="0" step="0.5" required />
            </div>
            <div>
              <label className="label">CA Score</label>
              <input type="number" className="input" value={form.ca_score} onChange={set('ca_score')} min="0" step="0.5" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={save.isPending}><Save size={14} />{save.isPending ? 'Saving...' : 'Record Score'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
