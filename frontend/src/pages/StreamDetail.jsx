import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useState } from 'react';

export default function StreamDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [subjectModal, setSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['stream', id], queryFn: () => api.get(`/streams/${id}`) });
  const { data: allSubjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });

  const assignSubject = useMutation({
    mutationFn: () => api.post(`/streams/${id}/subjects`, { subject_id: selectedSubject }),
    onSuccess: () => { qc.invalidateQueries(['stream', id]); toast.success('Subject assigned'); setSubjectModal(false); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const removeSubject = useMutation({
    mutationFn: (sid) => api.delete(`/streams/${id}/subjects/${sid}`),
    onSuccess: () => { qc.invalidateQueries(['stream', id]); toast.success('Subject removed'); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  if (isLoading) return <div className="card text-center py-10 text-gray-400">Loading...</div>;
  const stream = data?.data;
  if (!stream) return <div className="card text-center py-10 text-red-400">Stream not found</div>;

  const assignedIds = stream.subjects?.map(s => s.id) || [];
  const unassigned = allSubjects?.data?.filter(s => !assignedIds.includes(s.id)) || [];

  return (
    <div>
      <Link to="/streams" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={14} /> Back to Streams
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{stream.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{stream.description} · {stream.academic_year}</p>
        </div>
        <a href={`/api/reports/class/${id}?academic_year=2024&term=Term 1`} target="_blank" rel="noreferrer" className="btn-success text-sm">
          <Download size={15} /> Class Report
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Subjects ({stream.subjects?.length || 0})</h2>
            <button className="btn-primary text-xs py-1.5" onClick={() => setSubjectModal(true)}><Plus size={13} /></button>
          </div>
          {stream.subjects?.length ? (
            <div className="space-y-2">
              {stream.subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.code}</p>
                  </div>
                  <button onClick={() => removeSubject.mutate(s.id)} className="text-red-400 hover:text-red-600 p-1"><X size={13} /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No subjects assigned</p>}
        </div>

        {/* Students */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Students ({stream.students?.length || 0})</h2>
            <Link to={`/students?stream_id=${id}`} className="text-navy-600 text-xs hover:underline">View all →</Link>
          </div>
          {stream.students?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500">ID</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Name</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Gender</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stream.students.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-400 text-xs">{s.student_id}</td>
                      <td className="py-2 font-medium">{s.first_name} {s.last_name}</td>
                      <td className="py-2 text-gray-500">{s.gender || '-'}</td>
                      <td className="py-2"><Link to={`/students/${s.id}`} className="text-navy-600 text-xs hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-400 text-sm">No students in this stream</p>}
        </div>
      </div>

      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title="Assign Subject" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Subject</label>
            <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">-- Select --</option>
              {unassigned.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setSubjectModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" disabled={!selectedSubject || assignSubject.isPending} onClick={() => assignSubject.mutate()}>
              {assignSubject.isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
