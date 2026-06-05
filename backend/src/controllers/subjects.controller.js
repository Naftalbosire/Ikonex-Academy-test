const pool = require('../db/pool');

const getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM subjects WHERE id=$1', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, code, description, max_exam_score, max_ca_score } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required' });
    const result = await pool.query(
      'INSERT INTO subjects (name, code, description, max_exam_score, max_ca_score) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, code.toUpperCase(), description, max_exam_score || 70, max_ca_score || 30]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Subject code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, max_exam_score, max_ca_score } = req.body;
    const result = await pool.query(
      'UPDATE subjects SET name=$1, code=$2, description=$3, max_exam_score=$4, max_ca_score=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, code?.toUpperCase(), description, max_exam_score, max_ca_score, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Subject code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
