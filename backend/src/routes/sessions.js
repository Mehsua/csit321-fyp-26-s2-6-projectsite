const { Router } = require('express');
const { createSession } = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');

const router = Router();

router.post('/', optionalAuth, createSession);

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  authenticate(req, res, next);
}

module.exports = router;
