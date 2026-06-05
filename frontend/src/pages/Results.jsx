import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Trophy } from 'lucide-react';
import api from '../utils/api';

const medal = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;

export default function ResultsPage() {
  const [streamId, setStreamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [view, setView] = useState('overall'); // 'overall' | 'subject'
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState('2024');

  const { data: streams } = useQuery({ queryKey: ['streams'], queryFn: () => api.get('/streams') });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });

  const { data: classResults, isLoading: loadingClass } = useQuery({
    queryKey: ['class-results', streamId, year, term],
    queryFn: () => api.get(`/assessments/class/${streamId}/results?academic_year=${year}&term=${encodeURIComponent(term)}`),
    enabled: !!streamId && view === 'overall',
  });

  const { data: subjectResults, isLoading: loadingSubject } = useQuery({
    queryKey: ['subject-results', streamId, subjectId, year, term],
    queryFn: () => api.get(`/assessments/class/${streamId}/subject/${subjectId}?academic_year=${year}&term=${encodeURIComponent(term)}`),
    enabled: !!streamId && !!subjectId && view === 'subject',
  });

  const results = view === 'overall' ? classResults?.data : subjectResults?.data;
  const isLoading = view === 'overall' ? loadingClass : loadingSubject;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Results & Rankings</h1><p className="text-gray-500 text-sm mt-1">Class performance and student rankings</p></div>
        {streamId && (
          <a href={`/api/reports/class/${streamId}?academic_year=${year}&term=${encodeURIComponent(term)}`} target="_blank" rel="noreferrer" className="btn-success">
            <Download size={15} /> Export PDF
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Class Stream *</label>
            <select className="input" value={streamId} onChange={e => setStreamId(e.target.value)}>
              <option value="">-- Select Stream --</option>
              {streams?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Academic Year</label>
            <input className="input" value={year} onChange={e => setYear(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Term</label>
            <select className="input" value={term} onChange={e => setTerm(e.target.value)}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">View</label>
            <select className="input" value={view} onChange={e => setView(e.target.value)}>
              <option value="overall">Overall Ranking</option>
              <option value="subject">By Subject</option>
            </select>
          </div>
        </div>
        {view === 'subject' && (
          <div className="mt-3">
            <label className="label text-xs">Subject *</label>
            <select className="input max-w-xs" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">-- Select Subject --</option>
              {subjects?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {!streamId ? (
        <div className="card text-center py-12">
          <Trophy size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Select a class stream to view results</p>
        </div>
      ) : isLoading ? (
        <div className="card text-center py-10 text-gray-400">Loading results...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Pos</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                {view === 'overall' ? (
                  <>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Subjects</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Total Marks</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Average</th>
                  </>
                ) : (
                  <>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Exam</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">CA</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {results?.map((r, idx) => {
                const pos = view === 'overall' ? r.overall_position : r.subject_position;
                return (
                  <tr key={r.id || idx} className={`border-b border-gray-50 last:border-0 ${pos <= 3 ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 px-3 font-bold text-center">{medal(pos)}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-400">{r.student_id}</p>
                    </td>
                    {view === 'overall' ? (
                      <>
                        <td className="py-3 px-3 text-center text-gray-500">{r.subjects_taken}</td>
                        <td className="py-3 px-3 text-center font-semibold">{parseFloat(r.total_marks).toFixed(1)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`badge ${parseFloat(r.average_score) >= 70 ? 'bg-emerald-50 text-emerald-700' : parseFloat(r.average_score) >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                            {parseFloat(r.average_score).toFixed(1)}%
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-center">{r.exam_score ?? '-'}</td>
                        <td className="py-3 px-3 text-center">{r.ca_score ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-semibold">{r.total_score ?? '-'}</td>
                        <td className="py-3 px-3 text-center"><span className={`badge ${r.grade === 'A' ? 'bg-emerald-50 text-emerald-700' : r.grade === 'F' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>{r.grade || '-'}</span></td>
                      </>
                    )}
                  </tr>
                );
              })}
              {!results?.length && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No results found for selected criteria</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
