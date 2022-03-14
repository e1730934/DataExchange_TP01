const OpenApiValidator = require('express-openapi-validator');

const { Router } = require('express');

const authMiddleware = require('../modules/auth-middleware');
const auth = require('./auth');
const users = require('./users');
const students = require('./students');

const router = Router();

router.use(
  OpenApiValidator.middleware({
    apiSpec: './specs/api.yaml',
    validateRequests: true, // (default)
    validateResponses: true, // false by default
  }),
);

router.use('/auth', auth);
router.use('/users', authMiddleware, users);
router.use('/students', authMiddleware, students);

module.exports = router;
