const AuthService = require('../services/AuthService');

async function register(req, res, next) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  try {
    const user = await AuthService.register({ email, password, name });
    res.status(201).json({ user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const result = await AuthService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    if (err.status) {
      const body = { error: err.message };
      if (err.lock_until) body.lock_until = err.lock_until;
      return res.status(err.status).json(body);
    }
    next(err);
  }
}

async function logout(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  try {
    await AuthService.logout(token);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await AuthService.getMe(req.user.user_id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
