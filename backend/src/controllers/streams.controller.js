const pool = require('../db/pool');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.*, COUNT(s.id) AS student_count
      FROM class_streams cs
      LEFT JOIN students s ON s.class_stream_id = cs.id AND s.is_active = true
      GROUP BY cs.id
      ORDER BY cs.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const stream = await pool.query('SELECT * FROM class_streams WHERE id = $1', [id]);
    if (!stream.rows.length) return res.status(404).json({ success: false, message: 'Stream not found' });

    const subjects = await pool.query(`
      SELECT s.* FROM subjects s
      JOIN class_stream_subjects css ON css.subject_id = s.id
      WHERE css.class_stream_id = $1
      ORDER BY s.name
    `, [id]);

    const students = await pool.query(`
      SELECT * FROM students WHERE class_stream_id = $1 AND is_active = true ORDER BY first_name
    `, [id]);

    res.json({ success: true, data: { ...stream.rows[0], subjects: subjects.rows, students: students.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, academic_year } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const result = await pool.query(
      'INSERT INTO class_streams (name, description, academic_year) VALUES ($1, $2, $3) RETURNING *',
      [name, description, academic_year || '2024']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Stream name already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, academic_year } = req.body;
    const result = await pool.query(
      'UPDATE class_streams SET name=$1, description=$2, academic_year=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, description, academic_year, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Stream not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Stream name already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM class_streams WHERE id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Stream not found' });
    res.json({ success: true, message: 'Stream deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id } = req.body;
    await pool.query(
      'INSERT INTO class_stream_subjects (class_stream_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, subject_id]
    );
    res.json({ success: true, message: 'Subject assigned to stream' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeSubject = async (req, res) => {
  try {
    const { id, subject_id } = req.params;
    await pool.query('DELETE FROM class_stream_subjects WHERE class_stream_id=$1 AND subject_id=$2', [id, subject_id]);
    res.json({ success: true, message: 'Subject removed from stream' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, assignSubject, removeSubject };
