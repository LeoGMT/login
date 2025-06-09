function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.tipo !== role) {
      return res.status(403).send('<h2>Acceso denegado</h2><a href="/logout">Volver</a>');
    }
    next();
  };
}

module.exports = {
  requireLogin,
  requireRole
};
