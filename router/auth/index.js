const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../modules/db');

const router = express.Router();

const secret = 'dgjkgevuyetggvdghdfhegchgjdg,dvbmdghkdvghmdvhmshmg';

/*
 * Pour tester:
   curl -X POST -H "Content-Type: application/json" \
     -d '{"password": "allo", "email": "bluis@email.com"}' \
     http://localhost:3000/auth/create-token
 */
router.post('/create-token/', async (request, response) => {
  // 1. la requête va comporter deux paramtères importants: identifiant (email) + mot de passe
  const { email, password } = request.body;
  // 2. Est-ce que l'utilisateur existe?
  const user = await db('users').where('email', email).first();
  if (!user) {
    return response.status(401).json({ message: 'Vous n\'êtes pas autorizé' });
  }

  // 3. Est-ce que c'est le bon mot de passe?
  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return response.status(401).json({ message: 'Vous n\'êtes pas autorizé' });
  }

  // 4. Si oui aux deux dernières questions, je vais créer le token et l'envoyer à l'utilisateur.
  const token = jwt.sign({ userId: user.id }, secret);

  return response.status(200).json({ token });
});

/*
 * Pour tester:
   curl -X POST -H "Content-Type: application/json" \
     -d '{"password": "12345", "email": "nouveau@email.com", "name": "Untel"}' \
     http://localhost:3000/auth/register
 */
router.post('/register/', async (request, response) => {
  const { password, email, name } = request.body;

  const hashedPassword = await bcrypt.hash(password, 8);

  const query = db('users')
    .insert({
      password: hashedPassword,
      email,
      name,
    })
    .toString();
  await db('users')
    .insert({
      password: hashedPassword,
      email,
      name,
    });
  const infoUsers = await db('users')
    .select('id', 'name', 'email', 'dob')
    .where('email', email)
    .where('password', hashedPassword);
  console.log('La requête SQL est:', query);
  const expiresIn = 24 * 60 * 60;
  const accessToken = jwt.sign({ id: infoUsers[0].id }, secret, {
    expiresIn,
  });
  const { dob } = infoUsers[0];
  response.status(201).json({
    email, name, dob, accessToken,
  });
});

/*
 * Cette route est là à titre d'exemple seulement.
 * Ne jamais créer de route de hachage en production!
 * Pour tester:
   curl "http://localhost:3000/auth/hash?text=allo"
 */
router.get('/hash/', async (request, response) => {
  const hash = await bcrypt.hash(request.query.text, 8);
  response.status(200).json({ hash });
});

module.exports = router;
