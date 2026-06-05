import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';

export default function StreamsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState({ name: '', description: '', academic_year: '2024' });
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['streams'], queryFn: () => api.get('/streams') });

  const save = useMutation({
    mutationFn: (d) => editing ? api.put(`/streams/${editing.id}`, d) : api.post('/streams', d),
    onSuccess: () => { qc.invalidateQueries(['streams']); toast.success(editing ? 'Stream updated' : 'Stream created'); closeModal(); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/streams/${id}`),
    onSuccess: () => { qc.invalidateQueries(['streams']); toast.success('Stream deleted'); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', academic_year: '2024' }); setModal('form'); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', academic_year: s.academic_year }); setModal('form'); };
  const closeModal = () => { setModal(null); setEditing(null); };
  const handleSubmit = (e) => { e.preventDefault(); save.mutate(form); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Streams</h1>
          <p className="text-gray-500 text-sm mt-1">Manage school class streams</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} />Add Stream</button>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.data?.map(s => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.academic_year}</p>
                </div>
                <span className="badge bg-blue-50 text-blue-700">{s.student_count} students</span>
              </div>
              {s.description && <p className="text-sm text-gray-500 mb-4">{s.description}</p>}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <Link to={`/streams/${s.id}`} className="btn-secondary text-xs py-1.5"><Eye size={13} />View</Link>
                <button className="btn-secondary text-xs py-1.5" onClick={() => openEdit(s)}><Pencil size={13} />Edit</button>
                <button className="btn-danger text-xs py-1.5 ml-auto" onClick={() => { if(confirm('Delete this stream?')) del.mutate(s.id); }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {!data?.data?.length && (
            <div className="col-span-3 card text-center py-12 text-gray-400">No class streams yet. Create one to get started.</div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'form'} onClose={closeModal} title={editing ? 'Edit Stream' : 'New Class Stream'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Stream Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Form 1A" required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input" value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="2024" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Stream'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
