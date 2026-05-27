const { PrismaClient } = require('@prisma/client');
const { sendEvent } = require('../redpanda/producer');

const prisma = new PrismaClient();

exports.getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getService = async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { uuid: req.params.id } });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const { nombre } = req.body;
    const newService = await prisma.service.create({
      data: { nombre }
    });
    
    await sendEvent('service-events', { action: 'CREATE', service: newService });
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { nombre } = req.body;
    const updatedService = await prisma.service.update({
      where: { uuid: req.params.id },
      data: { nombre }
    });

    await sendEvent('service-events', { action: 'UPDATE', service: updatedService });
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await prisma.service.delete({ where: { uuid: req.params.id } });
    await sendEvent('service-events', { action: 'DELETE', serviceId: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
