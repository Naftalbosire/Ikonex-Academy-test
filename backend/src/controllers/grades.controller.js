const pool = require('../db/pool');

const getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grading_scales ORDER BY min_score DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, min_score, max_score, remarks, points } = req.body;
    const result = await pool.query(
      'UPDATE grading_scales SET grade=$1, min_score=$2, max_score=$3, remarks=$4, points=$5 WHERE id=$6 RETURNING *',
      [grade, min_score, max_score, remarks, points, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Grade not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, update };
