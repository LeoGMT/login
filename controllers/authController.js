//----------FUNCION DE REGISTRAR--------------

const bcrypt = require('bcryptjs');
const { validationResult, body } = require('express-validator');
const { createUser } = require('../models/userModel');

// Validaciones internas
const register = async (req, res) => {
  const { nombre, edad, email, tipo_usuario, contraseña } = req.body;

  // Validación manual
  const errores = [];

  if (!nombre || !/^[A-Za-z]+$/.test(nombre)) {
    errores.push('Nombre solo debe tener letras');
  }

  if (!edad || isNaN(edad) || edad < 0 || edad > 120) {
    errores.push('Edad debe ser un número positivo menor a 120');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errores.push('Correo no válido');
  }

  if (!['admin', 'normal'].includes(tipo_usuario)) {
    errores.push('Tipo de usuario inválido');
  }

  if (!contraseña || contraseña.length < 6) {
    errores.push('Contraseña muy corta, mínimo 6 caracteres');
  }

  // Si hay errores, enviar respuesta en HTML
  if (errores.length > 0) {
    return res.status(400).send(`
      <h1>Errores en el registro:</h1>
      <ul>${errores.map(err => `<li>${err}</li>`).join('')}</ul>
      <a href="/registro.html">Volver al registro</a>
    `);
  }

  try {
    const contraseña_hashed = await bcrypt.hash(contraseña, 10);
    const userId = await createUser({ nombre, edad, email, tipo_usuario, contraseña_hashed });

    res.send(`<h1>Usuario registrado con éxito</h1>
              <p>ID: ${userId}</p>
              <a href="/login.html">Ir al login</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error al registrar</h1>
                          <a href="/registro.html">Volver</a>`);
  }
};

module.exports = { register };



//-------------FUNCION DEL LOGIN----------------

const db = require('../models/db');

const login = async (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).send('<h2>Por favor ingrese todos los campos</h2><a href="/login.html">Volver</a>');
  }

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).send('<h2>Usuario no encontrado</h2><a href="/login.html">Volver</a>');
    }

    const user = rows[0];
    const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);

    if (!contraseñaValida) {
      return res.status(401).send('<h2>Contraseña incorrecta</h2><a href="/login.html">Volver</a>');
    }

    // Sesión segura
    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      tipo: user.tipo_usuario
    };

    // Redirigir según tipo de usuario
    if (user.tipo_usuario === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/usuario');
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('<h2>Error interno al iniciar sesión</h2><a href="/login.html">Volver</a>');
  }
};

module.exports = { register, login };


//Salir de la sesion
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  });
};

// Middleware para proteger rutas
const requiereLogin = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }
  next();
};

module.exports = { register, login, logout, requiereLogin };

//-----------------
