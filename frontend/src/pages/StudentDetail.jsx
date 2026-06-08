import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, User } from 'lucide-react';
import api from '../utils/api';

const API_BASE = "https://ikonex-academy-test.onrender.com";

const gradeColor = (g) =>
  ({
    A: 'bg-emerald-50 text-emerald-700',
    B: 'bg-blue-50 text-blue-700',
    C: 'bg-yellow-50 text-yellow-700',
    D: 'bg-orange-50 text-orange-700',
    E: 'bg-red-50 text-red-600',
    F: 'bg-red-100 text-red-700',
  }[g] || 'bg-gray-50 text-gray-600');

export default function StudentDetailPage() {
  const { id } = useParams();

  const { data: stuData } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`)
  });

  const { data: scoresData } = useQuery({
    queryKey: ['scores', id],
    queryFn: () =>
      api.get(
        `/assessments/student/${id}?academic_year=2024&term=Term 1`
      )
  });

  const student = stuData?.data;
  const scores = scoresData?.data || [];

  const total = scores.reduce(
    (s, r) => s + parseFloat(r.total_score || 0),
    0
  );

  const avg = scores.length ? (total / scores.length).toFixed(1) : '0';

  if (!student)
    return (
      <div className="card text-center py-10 text-gray-400">
        Loading...
      </div>
    );

  return (
    <div>
      <Link
        to="/students"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} /> Back to Students
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center text-navy-700 text-xl font-bold">
            {student.first_name[0]}
            {student.last_name[0]}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-gray-400 text-sm">
              {student.student_id} · {student.stream_name || 'No stream'}
            </p>
          </div>
        </div>

        <a
          href={`${API_BASE}/api/reports/student/${id}?academic_year=2024&term=Term%201`}
          target="_blank"
          rel="noreferrer"
          className="btn-success"
        >
          <Download size={15} /> Report Card
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User size={16} /> Personal Info
          </h2>

          <dl className="space-y-3 text-sm">
            {[
              ['Date of Birth', student.date_of_birth?.slice(0, 10) || '-'],
              ['Gender', student.gender || '-'],
              ['Email', student.email || '-'],
              ['Phone', student.phone || '-'],
              ['Guardian', student.guardian_name || '-'],
              ['Guardian Phone', student.guardian_phone || '-'],
              ['Address', student.address || '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-gray-400">{k}</dt>
                <dd className="font-medium text-right max-w-[60%]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              Academic Performance — Term 1, 2024
            </h2>
          </div>

          {scores.length ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-navy-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-navy-700">
                    {total.toFixed(1)}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Total Marks
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {avg}%
                  </p>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    Average
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {scores.length}
                  </p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    Subjects
                  </p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500">
                      Subject
                    </th>
                    <th className="text-center py-2 text-xs text-gray-500">
                      Exam
                    </th>
                    <th className="text-center py-2 text-xs text-gray-500">
                      CA
                    </th>
                    <th className="text-center py-2 text-xs text-gray-500">
                      Total
                    </th>
                    <th className="text-center py-2 text-xs text-gray-500">
                      Grade
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {scores.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 font-medium">
                        {s.subject_name}
                      </td>
                      <td className="py-2.5 text-center text-gray-500">
                        {s.exam_score}
                      </td>
                      <td className="py-2.5 text-center text-gray-500">
                        {s.ca_score}
                      </td>
                      <td className="py-2.5 text-center font-semibold">
                        {s.total_score}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`badge ${gradeColor(s.grade)}`}>
                          {s.grade || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              No scores recorded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}