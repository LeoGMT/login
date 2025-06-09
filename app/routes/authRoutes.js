const express = require('express');
const { body } = require('express-validator');
const { register } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);

module.exports = router;

const { login, logout, requiereLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);

// Ejemplo de ruta protegida
router.get('/dashboard', requiereLogin, (req, res) => {
  res.json({ mensaje: `Bienvenido, ${req.session.usuario.email}` });
});

//-------Tabla de usuarios admin----------
const { getAllUsers, deleteUserById, deleteAllUsers } = require('../models/userModel');
const { requireLogin, requireRole } = require('../middlewares/authMiddleware');

// Obtener todos los usuarios (solo admin)
router.get('/admin/usuarios', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const usuarios = await getAllUsers();
    let tablaHTML = `
      <h1>Lista de usuarios</h1>
      <table border="1" cellpadding="8">
        <tr><th>ID</th><th>Nombre</th><th>Edad</th><th>Email</th><th>Tipo</th><th>Acciones</th></tr>`;

    usuarios.forEach(u => {
      tablaHTML += `
        <tr>
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.edad}</td>
          <td>${u.email}</td>
          <td>${u.tipo_usuario}</td>
          <td>
            <form method="POST" action="/api/admin/eliminar/${u.id}" style="display:inline;">
              <button type="submit" onclick="return confirm('¿Eliminar este usuario?')">Eliminar</button>
            </form>
          </td>
        </tr>`;
    });

    tablaHTML += `</table>
      <br><form method="POST" action="/api/admin/eliminar-todos" onsubmit="return confirm('¿Eliminar todos los usuarios normales?')">
        <button type="submit">Eliminar todos (excepto admins)</button>
      </form>
      <br><a href="/admin">Volver al panel</a>`;

    res.send(tablaHTML);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener usuarios');
  }
});

// Eliminar usuario por ID
router.post('/admin/eliminar/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await deleteUserById(req.params.id);
    res.redirect('/api/admin/usuarios');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar usuario');
  }
});

// Eliminar todos menos admins
router.post('/admin/eliminar-todos', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await deleteAllUsers();
    res.redirect('/api/admin/usuarios');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar todos los usuarios');
  }
});

//Tabla de usuario usuario
router.get('/usuario/usuarios', requireLogin, requireRole('normal'), async (req, res) => {
  try {
    const usuarios2 = await getAllUsers();
    let tablaHTML = `
      <h1>Lista de usuarios</h1>
      <table border="1" cellpadding="8">
        <tr><th>ID</th><th>Nombre</th><th>Edad</th><th>Email</th></tr>`;

    usuarios2.forEach(u => {
      tablaHTML += `
        <tr>
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.edad}</td>
          <td>${u.email}</td>
        </tr>`;
    });

    tablaHTML += `</table>
      <br><a href="/usuario">Volver al panel</a>`;
    res.send(tablaHTML);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener usuarios');
  }
});
module.exports = router;