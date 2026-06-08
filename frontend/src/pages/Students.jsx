import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';

const emptyForm = { student_id: '', first_name: '', last_name: '', date_of_birth: '', gender: '', email: '', phone: '', address: '', guardian_name: '', guardian_phone: '', class_stream_id: '' };

export default function StudentsPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultStream = searchParams.get('stream_id') || '';
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState(defaultStream);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, class_stream_id: defaultStream });

  const { data: streams } = useQuery({ queryKey: ['streams'], queryFn: () => api.get('/streams') });
  const { data, isLoading } = useQuery({
    queryKey: ['students', streamFilter, search],
    queryFn: () => api.get(`/students?${new URLSearchParams({ ...(streamFilter && { stream_id: streamFilter }), ...(search && { search }) })}`),
  });

  const save = useMutation({
    mutationFn: (d) => editing ? api.put(`/students/${editing.id}`, d) : api.post('/students', d),
    onSuccess: () => { qc.invalidateQueries(['students']); toast.success(editing ? 'Student updated' : 'Student registered'); closeModal(); },
    onError: (e) => toast.error(e.message || 'Error'),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => { qc.invalidateQueries(['students']); toast.success('Student deleted'); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, class_stream_id: streamFilter }); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ student_id: s.student_id, first_name: s.first_name, last_name: s.last_name, date_of_birth: s.date_of_birth?.slice(0,10) || '', gender: s.gender || '', email: s.email || '', phone: s.phone || '', address: s.address || '', guardian_name: s.guardian_name || '', guardian_phone: s.guardian_phone || '', class_stream_id: s.class_stream_id || '' });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); };
  const handleSubmit = (e) => { e.preventDefault(); save.mutate(form); };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Students</h1><p className="text-gray-500 text-sm mt-1">{data?.data?.length || 0} students</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} />Register Student</button>
      </div>

      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="   Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-48" value={streamFilter} onChange={e => setStreamFilter(e.target.value)}>
            <option value="">All Streams</option>
            {streams?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['ID', 'Name', 'Class', 'Gender', 'Email', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(s => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 text-gray-400 text-xs font-mono">{s.student_id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-navy-50 rounded-full flex items-center justify-center text-navy-600 text-xs font-semibold">{s.first_name[0]}{s.last_name[0]}</div>
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3"><span className="badge bg-blue-50 text-blue-700">{s.stream_name || 'None'}</span></td>
                  <td className="py-3 px-3 text-gray-500">{s.gender || '-'}</td>
                  <td className="py-3 px-3 text-gray-500">{s.email || '-'}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1.5">
                      <Link to={`/students/${s.id}`} className="btn-secondary text-xs py-1 px-2"><Eye size={12} /></Link>
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => openEdit(s)}><Pencil size={12} /></button>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => { if(confirm('Delete student?')) del.mutate(s.id); }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Student' : 'Register Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Student ID *</label>
              <input className="input" value={form.student_id} onChange={set('student_id')} placeholder="STU001" required disabled={!!editing} />
            </div>
            <div>
              <label className="label">Class Stream</label>
              <select className="input" value={form.class_stream_id} onChange={set('class_stream_id')}>
                <option value="">-- Select --</option>
                {streams?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">First Name *</label>
              <input className="input" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" value={form.last_name} onChange={set('last_name')} required />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">-- Select --</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Guardian Name</label>
              <input className="input" value={form.guardian_name} onChange={set('guardian_name')} />
            </div>
            <div>
              <label className="label">Guardian Phone</label>
              <input className="input" value={form.guardian_phone} onChange={set('guardian_phone')} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address} onChange={set('address')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
