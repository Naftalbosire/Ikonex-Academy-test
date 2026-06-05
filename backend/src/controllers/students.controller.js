const pool = require('../db/pool');

const getAll = async (req, res) => {
  try {
    const { stream_id, search } = req.query;
    let query = `
      SELECT s.*, cs.name AS stream_name
      FROM students s
      LEFT JOIN class_streams cs ON cs.id = s.class_stream_id
      WHERE s.is_active = true
    `;
    const params = [];
    if (stream_id) { params.push(stream_id); query += ` AND s.class_stream_id = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length} OR s.student_id ILIKE $${params.length})`; }
    query += ' ORDER BY s.first_name, s.last_name';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, cs.name AS stream_name
      FROM students s
      LEFT JOIN class_streams cs ON cs.id = s.class_stream_id
      WHERE s.id = $1
    `, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { student_id, first_name, last_name, date_of_birth, gender, email, phone, address, guardian_name, guardian_phone, class_stream_id, enrollment_date } = req.body;
    if (!student_id || !first_name || !last_name) return res.status(400).json({ success: false, message: 'Student ID, first name, and last name are required' });

    const result = await pool.query(`
      INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, email, phone, address, guardian_name, guardian_phone, class_stream_id, enrollment_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [student_id, first_name, last_name, date_of_birth, gender, email, phone, address, guardian_name, guardian_phone, class_stream_id, enrollment_date || new Date()]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Student ID already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, date_of_birth, gender, email, phone, address, guardian_name, guardian_phone, class_stream_id } = req.body;
    const result = await pool.query(`
      UPDATE students SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, email=$5, phone=$6, address=$7, guardian_name=$8, guardian_phone=$9, class_stream_id=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *
    `, [first_name, last_name, date_of_birth, gender, email, phone, address, guardian_name, guardian_phone, class_stream_id, id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE students SET is_active=false WHERE id=$1', [id]);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
