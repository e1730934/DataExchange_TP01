const express = require('express');
const db = require('../../modules/db');

const router = express.Router();

/*
 * Pour tester:
   curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"firstName": "Louis", "lastName": "Tremblay", "email": "ltremblay@email.com"}' \
     http://localhost:3000/students
 */
router.post('/', async (request, response) => {
  const { firstName, lastName, email } = request.body;

  const oneStudent = await db('students').where('email', email).first();
  if (oneStudent) {
    return response.status(400).json({ message: 'Il y a déjà un étudiant avec cet email' });
  }

  const studentId = await db('students')
    .insert({ first_name: firstName, last_name: lastName, email }, ['id']);

  return response.status(201).json({ studentId: studentId[0] });
});

/*
 * Pour tester:
   S'assurer que l'update fonctionne:

   curl -X PUT -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"firstName": "Marine", "lastName": "Obert", "email": "mobert3@theguardian.com"}' \
     http://localhost:3000/students/4

   S'assurer qu'une erreur est retournée si l'étudiant n'existe pas:

   curl -X PUT -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"firstName": "Marine", "lastName": "Obert", "email": "mobert3@theguardian.com"}' \
     http://localhost:3000/students/999

   Erreur si le email est modifié et que ce email existe déjà:

   curl -X PUT -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"firstName": "Marine", "lastName": "Obert", "email": "tsnailham0@instagram.com"}' \
     http://localhost:3000/students/4

 */
router.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { firstName, lastName, email } = request.body;

  const studentExists = await db('students').where('id', id).first();
  if (!studentExists) {
    return response.status(400).json({ message: 'Cet étudiant n\'existe pas' });
  }

  const oneStudent = await db('students').where('email', email).first();
  if (oneStudent && oneStudent.id !== Number(id)) {
    return response.status(400).json({ message: 'Il y a déjà un étudiant avec cet email' });
  }

  await db('students')
    .update({ first_name: firstName, last_name: lastName, email })
    .where('id', id);

  return response.status(200).json({ modified: true });
});

/*
 * Pour tester:
   curl -X DELETE -H "Authorization: Bearer TOKEN" http://localhost:3000/students/1
 */
router.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const studentExists = await db('students').where('id', id).first();
  if (!studentExists) {
    return response.status(400).json({ message: 'Cet étudiant n\'existe pas' });
  }

  const results = await db('results').where('student_id', id);
  if (results.length) {
    return response.status(400).json({ message: 'Cet étudiant a des résultats. Il ne faut pas le supprimer.' });
  }

  await db('students').where('id', id).del();

  return response.status(200).json({ deleted: true });
});

/*
 * Pour tester:
   curl -H "Authorization: Bearer TOKEN" http://localhost:3000/students
   curl -H "Authorization: Bearer TOKEN" http://localhost:3000/students?name=Calvin
 */
router.get('/', async (request, response) => {
  let dbQuery = db('students')
    .select('id', 'first_name as firstName', 'last_name as lastName', 'email');

  if (request.query.name) {
    dbQuery = dbQuery
      .where('first_name', 'like', `${request.query.name}%`)
      .orWhere('last_name', 'like', `${request.query.name}%`);
  }

  const students = await dbQuery;

  return response.status(200).json(students);
});

/*
 * Pour tester:
   curl -H "Authorization: Bearer TOKEN" http://localhost:3000/students/1
 */
router.get('/:id', async (request, response) => {
  const student = await db('students')
    .select('first_name as firstName', 'last_name as lastName', 'email')
    .where('id', request.params.id)
    .first();
  if (student) {
    response.status(200).json({ student });
  } else {
    response.status(400).json({ status: 'not found' });
  }
  return null;
});

/*
 * Pour tester:
   curl -X PUT -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"note": 99}' \
     http://localhost:3000/students/1/evaluations/1/result
 */
router.put('/:studentId/evaluations/:evaluationId/result', async (request, response) => {
  const { studentId, evaluationId } = request.params;
  const { note } = request.body;

  const studentExists = await db('students').where('id', studentId).first();
  if (!studentExists) {
    return response.status(404).json({ message: 'Cet étudiant n\'existe pas' });
  }

  const evaluationExists = await db('evaluations').where('id', evaluationId).first();
  if (!evaluationExists) {
    return response.status(404).json({ message: 'Cette évaluation n\'existe pas' });
  }

  const resultExists = await db('results').where({
    student_id: studentId,
    eval_id: evaluationId,
  }).first();

  if (resultExists) {
    await db('results').update({ note }).where({
      student_id: studentId,
      eval_id: evaluationId,
    });
  } else {
    await db('results').insert({
      student_id: studentId,
      eval_id: evaluationId,
      note,
    });
  }

  return response.status(200).json({ modified: true });
});

/*
 * Pour tester:
   curl -X DELETE \
     -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/students/1/evaluations/1/result
 */
router.delete('/:studentId/evaluations/:evaluationId/result', async (request, response) => {
  const { studentId, evaluationId } = request.params;

  const studentExists = await db('students').where('id', studentId).first();
  if (!studentExists) {
    return response.status(404).json({ message: 'Cet étudiant n\'existe pas' });
  }

  const evaluationExists = await db('evaluations').where('id', evaluationId).first();
  if (!evaluationExists) {
    return response.status(404).json({ message: 'Cette évaluation n\'existe pas' });
  }

  await db('results')
    .where({
      student_id: studentId,
      eval_id: evaluationId,
    })
    .del();

  return response.status(200).json({ deleted: true });
});

/*
 * Pour tester:
   curl -H "Authorization: Bearer TOKEN" http://localhost:3000/students/1/results
 */
router.get('/:id/results', async (request, response) => {
  const studentId = request.params.id;

  const student = await db('students')
    .where('id', studentId)
    .first();

  if (!student) {
    return response.status(400).json({ status: 'not found' });
  }

  let results = await db('results')
    .select('note', 'evaluations.name as name', 'eval_id')
    .leftJoin('evaluations', 'evaluations.id', 'results.eval_id')
    .where('student_id', studentId);

  results = results.map((result) => ({
    note: result.note,
    evaluation: {
      id: result.eval_id,
      name: result.name,
    },
  }));

  return response.status(200).json(results);
});

module.exports = router;
