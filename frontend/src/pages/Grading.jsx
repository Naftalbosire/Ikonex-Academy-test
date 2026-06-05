import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function GradingPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data, isLoading } = useQuery({ queryKey: ['grades'], queryFn: () => api.get('/grades') });

  const save = useMutation({
    mutationFn: (d) => api.put(`/grades/${editing}`, d),
    onSuccess: () => { qc.invalidateQueries(['grades']); toast.success('Grade updated'); setEditing(null); },
    onError: (e) => toast.error(e.message || 'Error'),
  });

  const startEdit = (g) => { setEditing(g.id); setForm({ grade: g.grade, min_score: g.min_score, max_score: g.max_score, remarks: g.remarks, points: g.points }); };

  const gradeColor = (g) => ({ A: 'text-emerald-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', E: 'text-red-500', F: 'text-red-700' }[g] || 'text-gray-600');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grading Scale</h1>
        <p className="text-gray-500 text-sm mt-1">Configure grade boundaries and remarks</p>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto max-w-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Grade', 'Min Score', 'Max Score', 'Remarks', 'Points', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(g => (
                <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  {editing === g.id ? (
                    <>
                      <td className="py-2 px-4"><input className="input w-14 text-center" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} /></td>
                      <td className="py-2 px-4"><input type="number" className="input w-20" value={form.min_score} onChange={e => setForm(f => ({ ...f, min_score: e.target.value }))} /></td>
                      <td className="py-2 px-4"><input type="number" className="input w-20" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} /></td>
                      <td className="py-2 px-4"><input className="input w-28" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></td>
                      <td className="py-2 px-4"><input type="number" className="input w-16" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} step="0.1" /></td>
                      <td className="py-2 px-4">
                        <div className="flex gap-1.5">
                          <button className="btn-success text-xs py-1 px-2" onClick={() => save.mutate(form)} disabled={save.isPending}><Check size={12} /></button>
                          <button className="btn-secondary text-xs py-1 px-2" onClick={() => setEditing(null)}><X size={12} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 font-bold text-lg"><span className={gradeColor(g.grade)}>{g.grade}</span></td>
                      <td className="py-3 px-4">{g.min_score}</td>
                      <td className="py-3 px-4">{g.max_score}</td>
                      <td className="py-3 px-4 text-gray-500">{g.remarks}</td>
                      <td className="py-3 px-4 font-medium">{g.points}</td>
                      <td className="py-3 px-4">
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => startEdit(g)}><Pencil size={12} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
