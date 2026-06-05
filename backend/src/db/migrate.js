require('dotenv').config();
const pool = require('./pool');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS class_streams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2024',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10),
        email VARCHAR(150),
        phone VARCHAR(20),
        address TEXT,
        guardian_name VARCHAR(200),
        guardian_phone VARCHAR(20),
        class_stream_id INTEGER REFERENCES class_streams(id) ON DELETE SET NULL,
        enrollment_date DATE DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        max_exam_score NUMERIC(5,2) DEFAULT 100,
        max_ca_score NUMERIC(5,2) DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS class_stream_subjects (
        id SERIAL PRIMARY KEY,
        class_stream_id INTEGER NOT NULL REFERENCES class_streams(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(class_stream_id, subject_id)
      );

      CREATE TABLE IF NOT EXISTS grading_scales (
        id SERIAL PRIMARY KEY,
        grade VARCHAR(5) NOT NULL,
        min_score NUMERIC(5,2) NOT NULL,
        max_score NUMERIC(5,2) NOT NULL,
        remarks VARCHAR(100),
        points NUMERIC(4,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        class_stream_id INTEGER NOT NULL REFERENCES class_streams(id) ON DELETE CASCADE,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2024',
        term VARCHAR(20) NOT NULL DEFAULT 'Term 1',
        exam_score NUMERIC(5,2) DEFAULT 0,
        ca_score NUMERIC(5,2) DEFAULT 0,
        total_score NUMERIC(5,2) GENERATED ALWAYS AS (exam_score + ca_score) STORED,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id, subject_id, academic_year, term)
      );
    `);

    // Insert default grading scale
    await client.query(`
      INSERT INTO grading_scales (grade, min_score, max_score, remarks, points) VALUES
        ('A', 80, 100, 'Excellent', 4.0),
        ('B', 70, 79.99, 'Very Good', 3.0),
        ('C', 60, 69.99, 'Good', 2.0),
        ('D', 50, 59.99, 'Average', 1.0),
        ('E', 40, 49.99, 'Below Average', 0.5),
        ('F', 0, 39.99, 'Fail', 0.0)
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(console.error);
