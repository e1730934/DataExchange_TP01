const express = require('express');
const db = require('../../modules/db');

const router = express.Router();

/*
 * Pour tester:
   curl -H "Authorization: Bearer TOKEN" http://localhost:3000/users/1
 */
router.get('/:id', async (request, response) => {
  const user = await db('users').where('id', request.params.id).first();
  delete user.password;
  if (user) {
    response.status(200).json({ user });
  } else {
    response.status(400).json({ status: 'not found' });
  }
  return null;
});

module.exports = router;
