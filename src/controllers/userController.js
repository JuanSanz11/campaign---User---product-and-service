const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { sendEvent } = require('../redpanda/producer');

const prisma = new PrismaClient();

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { uuid: true, nombre: true, email: true } // Excluir contrasena
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { uuid: req.params.id },
      select: { uuid: true, nombre: true, email: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const newUser = await prisma.user.create({
      data: { nombre, email, contrasena: hashedPassword }
    });
    
    // Enviar evento a Redpanda
    await sendEvent('user-events', { action: 'CREATE', user: { uuid: newUser.uuid, email: newUser.email } });
    
    res.status(201).json({ uuid: newUser.uuid, nombre, email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;
    const updateData = { nombre, email };
    
    if (contrasena) {
      updateData.contrasena = await bcrypt.hash(contrasena, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { uuid: req.params.id },
      data: updateData,
      select: { uuid: true, nombre: true, email: true }
    });

    await sendEvent('user-events', { action: 'UPDATE', user: updatedUser });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { uuid: req.params.id } });
    await sendEvent('user-events', { action: 'DELETE', userId: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
