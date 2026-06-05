const pool = require('../db/pool');
const PDFDocument = require('pdfkit');

const generateStudentReportCard = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { academic_year = '2024', term = 'Term 1' } = req.query;

    // Fetch student info
    const stuResult = await pool.query(`
      SELECT s.*, cs.name AS stream_name
      FROM students s
      LEFT JOIN class_streams cs ON cs.id = s.class_stream_id
      WHERE s.id = $1
    `, [student_id]);
    if (!stuResult.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const student = stuResult.rows[0];

    // Fetch scores
    const scoresResult = await pool.query(`
      SELECT a.*, subj.name AS subject_name, subj.code, subj.max_exam_score, subj.max_ca_score,
             gs.grade, gs.remarks, gs.points,
             RANK() OVER (PARTITION BY a.subject_id ORDER BY a.total_score DESC) AS subject_position
      FROM assessments a
      JOIN subjects subj ON subj.id = a.subject_id
      LEFT JOIN grading_scales gs ON a.total_score >= gs.min_score AND a.total_score <= gs.max_score
      WHERE a.student_id = $1 AND a.academic_year = $2 AND a.term = $3
      ORDER BY subj.name
    `, [student_id, academic_year, term]);

    // Get overall position
    const posResult = await pool.query(`
      SELECT overall_position, total_marks, average_score, total_students FROM (
        SELECT st.id,
          SUM(a.total_score) AS total_marks,
          AVG(a.total_score) AS average_score,
          RANK() OVER (ORDER BY AVG(a.total_score) DESC) AS overall_position,
          COUNT(*) OVER () AS total_students
        FROM students st
        LEFT JOIN assessments a ON a.student_id = st.id AND a.academic_year=$2 AND a.term=$3
        WHERE st.class_stream_id = $1 AND st.is_active = true
        GROUP BY st.id
      ) ranked WHERE id = $4
    `, [student.class_stream_id, academic_year, term, student_id]);

    const pos = posResult.rows[0] || {};
    const scores = scoresResult.rows;

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${student.student_id}_${term.replace(' ','_')}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill('#1a3c5e');
    doc.fill('white').fontSize(22).font('Helvetica-Bold').text('IKONEX ACADEMY', 40, 20, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Student Report Card', 40, 48, { align: 'center' });
    doc.fontSize(10).text(`${academic_year} | ${term}`, 40, 66, { align: 'center' });

    // Student details
    doc.fill('#1a3c5e').rect(40, 100, doc.page.width - 80, 1).fill();
    doc.fill('#333').fontSize(11).font('Helvetica-Bold').text('STUDENT INFORMATION', 40, 110);
    
    const info = [
      ['Name:', `${student.first_name} ${student.last_name}`],
      ['Student ID:', student.student_id],
      ['Class:', student.stream_name || 'N/A'],
      ['Gender:', student.gender || 'N/A'],
    ];
    let y = 128;
    info.forEach(([label, value], i) => {
      const x = i % 2 === 0 ? 40 : 320;
      if (i % 2 === 0 && i > 0) y += 18;
      doc.fill('#666').font('Helvetica').fontSize(9).text(label, x, y);
      doc.fill('#111').font('Helvetica-Bold').text(value, x + 80, y);
    });
    y += 30;

    // Performance summary
    doc.fill('#1a3c5e').rect(40, y, doc.page.width - 80, 1).fill();
    y += 8;
    doc.fill('#333').fontSize(11).font('Helvetica-Bold').text('PERFORMANCE SUMMARY', 40, y);
    y += 18;

    const totalMarks = scores.reduce((s, r) => s + parseFloat(r.total_score || 0), 0);
    const avg = scores.length ? (totalMarks / scores.length).toFixed(1) : '0.0';

    const summaryData = [
      ['Total Marks:', totalMarks.toFixed(1)],
      ['Average Score:', `${avg}%`],
      ['Overall Position:', pos.overall_position ? `${pos.overall_position} / ${pos.total_students}` : 'N/A'],
      ['Subjects Taken:', scores.length.toString()],
    ];
    summaryData.forEach(([label, value], i) => {
      const x = i % 2 === 0 ? 40 : 320;
      if (i % 2 === 0 && i > 0) y += 18;
      doc.fill('#666').font('Helvetica').fontSize(9).text(label, x, y);
      doc.fill('#111').font('Helvetica-Bold').text(value, x + 100, y);
    });
    y += 30;

    // Scores table
    doc.fill('#1a3c5e').rect(40, y, doc.page.width - 80, 1).fill();
    y += 8;
    doc.fill('#333').fontSize(11).font('Helvetica-Bold').text('SUBJECT RESULTS', 40, y);
    y += 16;

    // Table header
    doc.fill('#1a3c5e').rect(40, y, doc.page.width - 80, 20).fill();
    const cols = [40, 180, 270, 340, 420, 470, 520];
    const headers = ['Subject', 'Exam', 'CA', 'Total', 'Grade', 'Remarks'];
    headers.forEach((h, i) => {
      doc.fill('white').font('Helvetica-Bold').fontSize(9).text(h, cols[i], y + 5, { width: cols[i+1] - cols[i] - 4 });
    });
    y += 20;

    // Table rows
    scores.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? '#f8f9fa' : 'white';
      doc.fill(bg).rect(40, y, doc.page.width - 80, 18).fill();
      const rowData = [row.subject_name, row.exam_score, row.ca_score, row.total_score, row.grade || '-', row.remarks || '-'];
      rowData.forEach((val, i) => {
        doc.fill('#333').font('Helvetica').fontSize(9).text(String(val || '0'), cols[i], y + 4, { width: cols[i+1] ? cols[i+1] - cols[i] - 4 : 60 });
      });
      y += 18;
    });

    // Footer
    y += 20;
    doc.fill('#666').fontSize(8).font('Helvetica').text('This report was generated electronically by Ikonex Academy Student Management System.', 40, y, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 40, y + 12, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateClassReport = async (req, res) => {
  try {
    const { stream_id } = req.params;
    const { academic_year = '2024', term = 'Term 1' } = req.query;

    const streamResult = await pool.query('SELECT * FROM class_streams WHERE id=$1', [stream_id]);
    if (!streamResult.rows.length) return res.status(404).json({ success: false, message: 'Stream not found' });
    const stream = streamResult.rows[0];

    const result = await pool.query(`
      SELECT 
        st.student_id, st.first_name, st.last_name,
        COUNT(a.id) AS subjects_taken,
        COALESCE(SUM(a.total_score), 0) AS total_marks,
        COALESCE(AVG(a.total_score), 0) AS average_score,
        RANK() OVER (ORDER BY COALESCE(AVG(a.total_score), 0) DESC) AS overall_position
      FROM students st
      LEFT JOIN assessments a ON a.student_id = st.id AND a.academic_year=$2 AND a.term=$3
      WHERE st.class_stream_id = $1 AND st.is_active = true
      GROUP BY st.id, st.student_id, st.first_name, st.last_name
      ORDER BY overall_position
    `, [stream_id, academic_year, term]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="class_report_${stream.name.replace(' ','_')}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill('#1a3c5e');
    doc.fill('white').fontSize(22).font('Helvetica-Bold').text('IKONEX ACADEMY', 40, 20, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Class Performance Report — ${stream.name}`, 40, 48, { align: 'center' });
    doc.fontSize(10).text(`${academic_year} | ${term}`, 40, 66, { align: 'center' });

    let y = 110;

    // Table header
    doc.fill('#1a3c5e').rect(40, y, doc.page.width - 80, 20).fill();
    const cols = [40, 80, 200, 300, 370, 440, 500];
    const headers = ['Pos', 'ID', 'Name', 'Subjects', 'Total', 'Average'];
    headers.forEach((h, i) => {
      doc.fill('white').font('Helvetica-Bold').fontSize(9).text(h, cols[i], y + 5);
    });
    y += 20;

    result.rows.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? '#f8f9fa' : 'white';
      doc.fill(bg).rect(40, y, doc.page.width - 80, 18).fill();
      const rowData = [row.overall_position, row.student_id, `${row.first_name} ${row.last_name}`, row.subjects_taken, parseFloat(row.total_marks).toFixed(1), parseFloat(row.average_score).toFixed(1)];
      rowData.forEach((val, i) => {
        doc.fill('#333').font('Helvetica').fontSize(9).text(String(val), cols[i], y + 4);
      });
      y += 18;
    });

    y += 20;
    doc.fill('#666').fontSize(8).text(`Generated: ${new Date().toLocaleDateString('en-KE')} | Ikonex Academy SMS`, 40, y, { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { generateStudentReportCard, generateClassReport };
