const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Helper to send registration magic link (could be logged or sent via N8N)
const sendMagicLinkEmail = async (email, token, nombre) => {
  const loginLink = `http://localhost:5173/?token=${token}`;
  console.log(`\n==================================================`);
  console.log(`📧 ENVIANDO DIRECT ACCESS LINK PARA: ${nombre} (${email})`);
  console.log(`🔗 ENLACE DIRECTO: ${loginLink}`);
  console.log(`==================================================\n`);

  // Optionally trigger N8N workflow if configured
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, {
        action: 'SEND_MAGIC_LINK',
        email,
        nombre,
        loginLink,
        token
      });
      console.log('N8N Magic Link notification sent.');
    } catch (err) {
      console.error('Failed to notify N8N about magic link:', err.message);
    }
  }
};

/**
 * @route   POST /api/auth/register-magic-link
 * @desc    Submit email to receive a registration/direct access token
 */
router.post('/register-magic-link', async (req, res) => {
  try {
    const { email, nombre } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El email es requerido.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Store the token in the database
    await prisma.verificationToken.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt
      }
    });

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Send magic link (creates user if new on verification)
    await sendMagicLinkEmail(cleanEmail, token, nombre || existingUser?.nombre || 'Usuario');

    res.json({ success: true, message: 'Enlace de acceso directo enviado a tu email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify magic link token and log in / complete registration
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token es requerido.' });
    }

    // Find and validate token
    const dbToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }

    const email = dbToken.email;

    // Get or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create a default user
      const defaultPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          nombre: email.split('@')[0],
          email,
          contrasena: defaultPassword,
          role: 'user' // default role is standard user
        }
      });
    }

    // Delete token after successful use
    await prisma.verificationToken.delete({ where: { token } });

    // Generate JWT
    const jwtToken = jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token: jwtToken, user: { uuid: user.uuid, email: user.email, role: user.role, nombre: user.nombre } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Standard email/password login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const jwtToken = jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token: jwtToken, user: { uuid: user.uuid, email: user.email, role: user.role, nombre: user.nombre } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Fetch current authenticated user profile
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Acceso denegado. Token no provisto.' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { uuid: payload.uuid },
      select: { uuid: true, nombre: true, email: true, role: true }
    });
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
});

module.exports = router;
