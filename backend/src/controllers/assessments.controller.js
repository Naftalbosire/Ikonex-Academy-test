const pool = require('../db/pool');

const getGrade = async (client, score) => {
  const result = await client.query(
    'SELECT * FROM grading_scales WHERE $1 >= min_score AND $1 <= max_score LIMIT 1',
    [score]
  );
  return result.rows[0] || { grade: 'F', remarks: 'Fail', points: 0 };
};

// Record or update a score
const upsertScore = async (req, res) => {
  const client = await pool.connect();
  try {
    const { student_id, subject_id, class_stream_id, academic_year, term, exam_score, ca_score } = req.body;
    if (!student_id || !subject_id || !class_stream_id) {
      return res.status(400).json({ success: false, message: 'student_id, subject_id, class_stream_id are required' });
    }

    // Validate subject belongs to stream
    const subjectCheck = await client.query(
      'SELECT * FROM class_stream_subjects WHERE class_stream_id=$1 AND subject_id=$2',
      [class_stream_id, subject_id]
    );
    if (!subjectCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Subject is not assigned to this class stream' });
    }

    // Get max scores
    const subj = await client.query('SELECT * FROM subjects WHERE id=$1', [subject_id]);
    const maxExam = parseFloat(subj.rows[0]?.max_exam_score || 70);
    const maxCA = parseFloat(subj.rows[0]?.max_ca_score || 30);

    if (parseFloat(exam_score) > maxExam) return res.status(400).json({ success: false, message: `Exam score cannot exceed ${maxExam}` });
    if (parseFloat(ca_score) > maxCA) return res.status(400).json({ success: false, message: `CA score cannot exceed ${maxCA}` });
    if (parseFloat(exam_score) < 0 || parseFloat(ca_score) < 0) return res.status(400).json({ success: false, message: 'Scores cannot be negative' });

    const result = await client.query(`
      INSERT INTO assessments (student_id, subject_id, class_stream_id, academic_year, term, exam_score, ca_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (student_id, subject_id, academic_year, term)
      DO UPDATE SET exam_score=$6, ca_score=$7, updated_at=NOW()
      RETURNING *
    `, [student_id, subject_id, class_stream_id, academic_year || '2024', term || 'Term 1', exam_score || 0, ca_score || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// Get student scores with grades
const getStudentScores = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, term } = req.query;
    let query = `
      SELECT a.*, s.name AS subject_name, s.code AS subject_code,
             s.max_exam_score, s.max_ca_score,
             gs.grade, gs.remarks, gs.points
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN grading_scales gs ON a.total_score >= gs.min_score AND a.total_score <= gs.max_score
      WHERE a.student_id = $1
    `;
    const params = [id];
    if (academic_year) { params.push(academic_year); query += ` AND a.academic_year=$${params.length}`; }
    if (term) { params.push(term); query += ` AND a.term=$${params.length}`; }
    query += ' ORDER BY s.name';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get class performance for a subject
const getClassPerformance = async (req, res) => {
  try {
    const { stream_id, subject_id } = req.params;
    const { academic_year, term } = req.query;

    let query = `
      SELECT 
        st.id, st.student_id, st.first_name, st.last_name,
        a.exam_score, a.ca_score, a.total_score,
        gs.grade, gs.remarks, gs.points,
        RANK() OVER (ORDER BY a.total_score DESC) AS subject_position
      FROM students st
      LEFT JOIN assessments a ON a.student_id = st.id AND a.subject_id = $2
      LEFT JOIN grading_scales gs ON a.total_score >= gs.min_score AND a.total_score <= gs.max_score
      WHERE st.class_stream_id = $1 AND st.is_active = true
    `;
    const params = [stream_id, subject_id];
    if (academic_year) { params.push(academic_year); query += ` AND (a.academic_year=$${params.length} OR a.academic_year IS NULL)`; }
    if (term) { params.push(term); query += ` AND (a.term=$${params.length} OR a.term IS NULL)`; }
    query += ' ORDER BY subject_position NULLS LAST, st.first_name';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get class results with overall positions
const getClassResults = async (req, res) => {
  try {
    const { stream_id } = req.params;
    const { academic_year, term } = req.query;
    const ay = academic_year || '2024';
    const t = term || 'Term 1';

    const result = await pool.query(`
      SELECT 
        st.id, st.student_id, st.first_name, st.last_name,
        COUNT(a.id) AS subjects_taken,
        COALESCE(SUM(a.total_score), 0) AS total_marks,
        COALESCE(AVG(a.total_score), 0) AS average_score,
        RANK() OVER (ORDER BY COALESCE(AVG(a.total_score), 0) DESC) AS overall_position
      FROM students st
      LEFT JOIN assessments a ON a.student_id = st.id AND a.academic_year=$2 AND a.term=$3
      WHERE st.class_stream_id = $1 AND st.is_active = true
      GROUP BY st.id, st.student_id, st.first_name, st.last_name
      ORDER BY overall_position
    `, [stream_id, ay, t]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all assessments
const getAll = async (req, res) => {
  try {
    const { stream_id, student_id, subject_id } = req.query;
    let query = `
      SELECT a.*, s.name AS subject_name, st.first_name, st.last_name, st.student_id AS stu_id,
             gs.grade, gs.remarks
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      JOIN students st ON st.id = a.student_id
      LEFT JOIN grading_scales gs ON a.total_score >= gs.min_score AND a.total_score <= gs.max_score
      WHERE 1=1
    `;
    const params = [];
    if (stream_id) { params.push(stream_id); query += ` AND a.class_stream_id=$${params.length}`; }
    if (student_id) { params.push(student_id); query += ` AND a.student_id=$${params.length}`; }
    if (subject_id) { params.push(subject_id); query += ` AND a.subject_id=$${params.length}`; }
    query += ' ORDER BY st.first_name, s.name';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM assessments WHERE id=$1', [id]);
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upsertScore, getStudentScores, getClassPerformance, getClassResults, getAll, remove };
