import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';

const emptyForm = { name: '', code: '', description: '', max_exam_score: '70', max_ca_score: '30' };

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });

  const save = useMutation({
    mutationFn: (d) => editing ? api.put(`/subjects/${editing.id}`, d) : api.post('/subjects', d),
    onSuccess: () => { qc.invalidateQueries(['subjects']); toast.success(editing ? 'Subject updated' : 'Subject created'); closeModal(); },
    onError: (e) => toast.error(e.message || 'Error'),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries(['subjects']); toast.success('Subject deleted'); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, code: s.code, description: s.description || '', max_exam_score: s.max_exam_score, max_ca_score: s.max_ca_score }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); save.mutate(form); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Subjects</h1><p className="text-gray-500 text-sm mt-1">Manage school subjects</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} />Add Subject</button>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Subject', 'Code', 'Max Exam', 'Max CA', 'Total Max', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(s => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium">{s.name}</td>
                  <td className="py-3 px-3"><span className="badge bg-gray-100 text-gray-600 font-mono">{s.code}</span></td>
                  <td className="py-3 px-3 text-gray-500">{s.max_exam_score}</td>
                  <td className="py-3 px-3 text-gray-500">{s.max_ca_score}</td>
                  <td className="py-3 px-3 font-semibold">{parseFloat(s.max_exam_score) + parseFloat(s.max_ca_score)}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1.5">
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => openEdit(s)}><Pencil size={12} /></button>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => { if(confirm('Delete subject?')) del.mutate(s.id); }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No subjects yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Subject' : 'Add Subject'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Subject Name *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Code *</label>
            <input className="input" value={form.code} onChange={set('code')} placeholder="e.g. MATH" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Max Exam Score</label>
              <input type="number" className="input" value={form.max_exam_score} onChange={set('max_exam_score')} min="0" max="100" />
            </div>
            <div>
              <label className="label">Max CA Score</label>
              <input type="number" className="input" value={form.max_ca_score} onChange={set('max_ca_score')} min="0" max="100" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
