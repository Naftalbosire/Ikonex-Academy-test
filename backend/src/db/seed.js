require('dotenv').config();
const pool = require('./pool');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    // Insert class streams
    const streams = await client.query(`
      INSERT INTO class_streams (name, description, academic_year) VALUES
        ('Form 1A', 'Form One Stream A', '2024'),
        ('Form 1B', 'Form One Stream B', '2024'),
        ('Form 2A', 'Form Two Stream A', '2024'),
        ('Form 2B', 'Form Two Stream B', '2024')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
    `);
    console.log('✅ Streams seeded');

    // Insert subjects
    const subjects = await client.query(`
      INSERT INTO subjects (name, code, max_exam_score, max_ca_score) VALUES
        ('Mathematics', 'MATH', 70, 30),
        ('English Language', 'ENG', 70, 30),
        ('Kiswahili', 'KIS', 70, 30),
        ('Biology', 'BIO', 70, 30),
        ('Chemistry', 'CHEM', 70, 30),
        ('Physics', 'PHY', 70, 30),
        ('History & Government', 'HIST', 70, 30),
        ('Geography', 'GEO', 70, 30)
      ON CONFLICT (code) DO NOTHING
      RETURNING id, name;
    `);
    console.log('✅ Subjects seeded');

    // Assign subjects to streams
    if (streams.rows.length > 0 && subjects.rows.length > 0) {
      for (const stream of streams.rows) {
        for (const subject of subjects.rows) {
          await client.query(`
            INSERT INTO class_stream_subjects (class_stream_id, subject_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [stream.id, subject.id]);
        }
      }
      console.log('✅ Stream-subject assignments seeded');
    }

    // Insert sample students
    if (streams.rows.length > 0) {
      const streamId = streams.rows[0].id;
      const students = [
        ['STU001', 'Alice', 'Wanjiru', '2009-03-15', 'Female', 'alice@example.com'],
        ['STU002', 'Brian', 'Ochieng', '2009-07-22', 'Male', 'brian@example.com'],
        ['STU003', 'Carol', 'Muthoni', '2009-01-10', 'Female', 'carol@example.com'],
        ['STU004', 'David', 'Kamau', '2009-09-05', 'Male', 'david@example.com'],
        ['STU005', 'Eve', 'Akinyi', '2009-11-30', 'Female', 'eve@example.com'],
      ];
      for (const [sid, fn, ln, dob, gender, email] of students) {
        await client.query(`
          INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, email, class_stream_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (student_id) DO NOTHING
        `, [sid, fn, ln, dob, gender, email, streamId]);
      }
      console.log('✅ Sample students seeded');
    }

    console.log('🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(console.error);
