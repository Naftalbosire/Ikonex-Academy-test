const router = require('express').Router();
const streams = require('../controllers/streams.controller');
const students = require('../controllers/students.controller');
const subjects = require('../controllers/subjects.controller');
const assessments = require('../controllers/assessments.controller');
const reports = require('../controllers/reports.controller');
const grades = require('../controllers/grades.controller');

// Class Streams
router.get('/streams', streams.getAll);
router.get('/streams/:id', streams.getOne);
router.post('/streams', streams.create);
router.put('/streams/:id', streams.update);
router.delete('/streams/:id', streams.remove);
router.post('/streams/:id/subjects', streams.assignSubject);
router.delete('/streams/:id/subjects/:subject_id', streams.removeSubject);

// Students
router.get('/students', students.getAll);
router.get('/students/:id', students.getOne);
router.post('/students', students.create);
router.put('/students/:id', students.update);
router.delete('/students/:id', students.remove);

// Subjects
router.get('/subjects', subjects.getAll);
router.get('/subjects/:id', subjects.getOne);
router.post('/subjects', subjects.create);
router.put('/subjects/:id', subjects.update);
router.delete('/subjects/:id', subjects.remove);

// Assessments
router.get('/assessments', assessments.getAll);
router.post('/assessments', assessments.upsertScore);
router.delete('/assessments/:id', assessments.remove);
router.get('/assessments/student/:id', assessments.getStudentScores);
router.get('/assessments/class/:stream_id/subject/:subject_id', assessments.getClassPerformance);
router.get('/assessments/class/:stream_id/results', assessments.getClassResults);

// Grading Scales
router.get('/grades', grades.getAll);
router.put('/grades/:id', grades.update);

// Reports (PDF)
router.get('/reports/student/:student_id', reports.generateStudentReportCard);
router.get('/reports/class/:stream_id', reports.generateClassReport);

module.exports = router;
