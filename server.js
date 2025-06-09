const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <-- faltaba esto
const helmet = require('helmet');
const MySQLStore = require('express-mysql-session')(session);

// 🟢 Cargar variables de entorno lo primero
dotenv.config();

const db = require('./models/db.js');

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const sessionStore = new MySQLStore({}, mysqlPool);

const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 Seguridad básica
app.use(helmet());

// 🟢 Middleware CORS
app.use(cors({
  origin: process.env.URLFRONTED || 'http://localhost:3000',
  credentials: true
}));

// 🟢 Middleware para parsear datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 Servir archivos estáticos ANTES de las rutas
app.use(express.static('public'));

// 🟢 Middleware de sesión
app.use(session({
  secret: process.env.SECRETSESSION || 'clave_super_secreta',
  proxy: process.env.NODE_ENV === 'production',
  store: sessionStore, // <-- aquí estaba mal escrito
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? false : false, // ← poner true solo si usas HTTPS
    httpOnly: true,
    sameSite: 'none', // none solo si usas https
    maxAge: 1000 * 60 * 60
  }
}));

// 🟢 Redirigir a login correctamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Rutas para los formularios
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/registro.html'));
});

// Rutas protegidas
const { requireLogin, requireRole } = require('./middlewares/authMiddleware');

app.get('/usuario', requireLogin, requireRole('normal'), (req, res) => {
  res.send(`<h1>Bienvenido, ${req.session.user.nombre} (usuario normal)</h1><br><br>
            <a href="/api/usuario/usuarios">Tabla de usuarios</a><br><br>
            <a href="/logout">Cerrar sesión</a><br><br>`);
});

app.get('/admin', requireLogin, requireRole('admin'), (req, res) => {
  res.send(`<h1>Bienvenido, ${req.session.user.nombre} (administrador)</h1><br><br>
            <a href="/api/admin/usuarios">Tabla de usuarios</a><br><br>
            <a href="/logout">Cerrar sesión</a>`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error al cerrar sesión');
    }
    res.redirect('/login.html');
  });
});

// 🟢 API
app.use('/api', authRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
