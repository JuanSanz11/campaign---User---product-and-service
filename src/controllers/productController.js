const { PrismaClient } = require('@prisma/client');
const { sendEvent } = require('../redpanda/producer');

const prisma = new PrismaClient();

exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { uuid: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { nombre, precio, categoria, stock } = req.body;
    const newProduct = await prisma.product.create({
      data: { nombre, precio, categoria, stock }
    });
    
    await sendEvent('product-events', { action: 'CREATE', product: newProduct });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { nombre, precio, categoria, stock } = req.body;
    const updatedProduct = await prisma.product.update({
      where: { uuid: req.params.id },
      data: { nombre, precio, categoria, stock }
    });

    await sendEvent('product-events', { action: 'UPDATE', product: updatedProduct });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { uuid: req.params.id } });
    await sendEvent('product-events', { action: 'DELETE', productId: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
