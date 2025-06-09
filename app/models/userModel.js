const pool = require('./db');
const db = require('../models/db');

const createUser = async ({ nombre, edad, email, tipo_usuario, contraseña_hashed }) => {
  const query = `
    INSERT INTO usuarios (nombre, edad, email, tipo_usuario, contraseña)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute(query, [nombre, edad, email, tipo_usuario, contraseña_hashed]);
  return result.insertId;
};

//Encontrar usuario
async function findUserByEmail(email) {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0]; // Devuelve el primer usuario encontrado, o undefined
}

// Obtener todos los usuarios
async function getAllUsers() {
  const [rows] = await db.query('SELECT id, nombre, edad, email, tipo_usuario FROM usuarios');
  return rows;
}

// Eliminar un usuario por ID
async function deleteUserById(id) {
  const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return result.affectedRows;
}

// Eliminar todos los usuarios
async function deleteAllUsers() {
  const [result] = await db.query('DELETE FROM usuarios WHERE tipo != "admin"');
  return result.affectedRows;
}

module.exports = {
  createUser,
  findUserByEmail,
  getAllUsers,
  deleteUserById,
  deleteAllUsers
};

