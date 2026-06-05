import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StreamsPage from './pages/Streams';
import StreamDetailPage from './pages/StreamDetail';
import StudentsPage from './pages/Students';
import StudentDetailPage from './pages/StudentDetail';
import SubjectsPage from './pages/Subjects';
import AssessmentsPage from './pages/Assessments';
import ResultsPage from './pages/Results';
import GradingPage from './pages/Grading';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="/streams/:id" element={<StreamDetailPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/grading" element={<GradingPage />} />
      </Routes>
    </Layout>
  );
}
