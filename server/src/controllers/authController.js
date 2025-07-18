// controllers/authController.js

import User from '../models/User.js'; // Ajusta la ruta si es diferente
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Mejor desde .env

export const login = async (req, res) => {

  const { username, password } = req.body;

  console.log(username, password);
  
  try {
    // Buscar usuario
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Actualizar lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Retornar datos relevantes
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};


export const register = async (req, res) => {
  const { username, password, email, role } = req.body;

  try {
    // Verificar si ya existe un usuario con ese username o email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Usuario o email ya existe' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el nuevo usuario
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      role: role || 'user' // Solo usar 'admin' si es autorizado
    });

    await newUser.save();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};