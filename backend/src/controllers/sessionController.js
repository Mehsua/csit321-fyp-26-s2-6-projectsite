const SessionService = require('../services/SessionService');

async function createSession(req, res, next) {
  try {
    const session = req.user
      ? await SessionService.createAuthSession(req.user.user_id)
      : await SessionService.createGuestSession();
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession };
