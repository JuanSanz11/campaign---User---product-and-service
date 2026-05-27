const express = require('express');
const session = require('express-session');
const passport = require('./auth/google');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config({ quiet: true });

const { connectProducer } = require('./redpanda/producer');
const { connectConsumer } = require('./redpanda/consumer');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Usuarios, Productos y Servicios',
      version: '1.0.0',
      description: 'Documentación de la API REST para el sistema.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Google OAuth2 Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // Successful authentication
    res.json({ message: 'Login exitoso con Google', user: req.user });
  }
);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/campaigns', campaignRoutes);

// Admin routes (protected)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// N8N trigger route
const n8nRouter = require('./routes/n8n');
app.use('/api/n8n', n8nRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Iniciar servidor y servicios externos
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log('\x1b[32m%s\x1b[0m', 'Server ON');
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
    
    // Conectar con Redpanda (intentará conectarse, pero si no hay broker disponible puede fallar)
    try {
      await connectProducer();
      await connectConsumer();
    } catch (err) {
      console.warn("No se pudo conectar a Redpanda. Verifica que el broker esté corriendo si necesitas eventos de Kafka.", err.message);
    }
    
    // Seed master admin automatically
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const bcrypt = require('bcrypt');
      const masterEmail = process.env.MASTER_ADMIN_EMAIL || 'admin@admin.com';
      const masterPass = process.env.MASTER_ADMIN_PASSWORD || 'admin123';
      
      const existingMaster = await prisma.user.findFirst({
        where: { role: 'master' }
      });
      
      if (!existingMaster) {
        const hashedPassword = await bcrypt.hash(masterPass, 10);
        await prisma.user.create({
          data: {
            nombre: 'Master Admin',
            email: masterEmail,
            contrasena: hashedPassword,
            role: 'master'
          }
        });
        console.log(`\n==================================================`);
        console.log(`🔑 SE HA CREADO EL ADMINISTRADOR MASTER POR DEFECTO:`);
        console.log(`📧 EMAIL: ${masterEmail}`);
        console.log(`🔒 PASS:  ${masterPass}`);
        console.log(`==================================================\n`);
      }
    } catch (dbErr) {
      console.warn("No se pudo sembrar el administrador master. Es posible que falten migraciones en la BD.", dbErr.message);
    }
  });
}

module.exports = app;
