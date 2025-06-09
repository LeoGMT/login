const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.URLFRONTED || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRETSESSION || 'clave_super_secreta',
  proxy: process.env.NODE_ENV === 'production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // true si usas HTTPS
    httpOnly: true,
    sameSite: 'none'
  }
}));

app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

//Usar lo de la carpeta public
app.use(express.static('public'));

// Ruta para formulario de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Ruta para formulario de registro
app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/registro.html'));
});

//----------------Rutas de middlware------------------
const { requireLogin, requireRole } = require('./middlewares/authMiddleware');

// Ruta para usuarios normales
app.get('/usuario', requireLogin, requireRole('normal'), (req, res) => {
  res.send(`<h1>Bienvenido, ${req.session.user.nombre} (usuario normal)</h1><br><br>
            <a href="/api/usuario/usuarios">Tabla de usuarios</a><br><br>
            <a href="/logout">Cerrar sesión</a><br><br>`);
});

// Ruta para administradores
app.get('/admin', requireLogin, requireRole('admin'), (req, res) => {
  res.send(`<h1>Bienvenido, ${req.session.user.nombre} (administrador)</h1><br><br>
            <a href="/api/admin/usuarios">Tabla de usuarios</a><br><br>
            <a href="/logout">Cerrar sesión</a>`);
});

//ruta para logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error al cerrar sesión');
    }
    res.redirect('/login.html');
  });
});

const helmet = require('helmet');
app.use(helmet());

//NbSxtctXcGBOVeYdexZaQOKHiXhTNytM