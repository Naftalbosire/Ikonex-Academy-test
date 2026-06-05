import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, BookOpen, ClipboardList } from 'lucide-react';
import api from '../utils/api';

export default function Dashboard() {
  const { data: streams } = useQuery({ queryKey: ['streams'], queryFn: () => api.get('/streams') });
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students') });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });
  const { data: assessments } = useQuery({ queryKey: ['assessments'], queryFn: () => api.get('/assessments') });

  const stats = [
    { label: 'Class Streams', value: streams?.data?.length || 0, icon: GraduationCap, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Students', value: students?.data?.length || 0, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Subjects', value: subjects?.data?.length || 0, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
    { label: 'Score Records', value: assessments?.data?.length || 0, icon: ClipboardList, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to Ikonex Academy Student Management System</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Class Streams Overview</h2>
          {streams?.data?.length ? (
            <div className="space-y-3">
              {streams.data.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.academic_year}</p>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700">{s.student_count} students</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No streams yet</p>}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Students</h2>
          {students?.data?.slice(0, 6).length ? (
            <div className="space-y-3">
              {students.data.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-xs font-semibold">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-400">{s.stream_name || 'No stream'} · {s.student_id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No students yet</p>}
        </div>
      </div>
    </div>
  );
}
