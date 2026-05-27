const request = require('supertest');
const app = require('../src/app');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock Redpanda Producer
jest.mock('../src/redpanda/producer', () => ({
  sendEvent: jest.fn(),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Product Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const mockProducts = [
        { uuid: '1', nombre: 'Product 1', precio: 10, categoria: 'cat1', stock: 5 },
        { uuid: '2', nombre: 'Product 2', precio: 20, categoria: 'cat2', stock: 10 }
      ];
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const res = await request(app).get('/api/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = { nombre: 'New Product', precio: 100, categoria: 'cat', stock: 10 };
      const createdProduct = { uuid: '123', ...newProduct };
      
      prisma.product.create.mockResolvedValue(createdProduct);

      const res = await request(app)
        .post('/api/products')
        .send(newProduct);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: newProduct });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      prisma.product.delete.mockResolvedValue({ uuid: '123' });

      const res = await request(app).delete('/api/products/123');

      expect(res.statusCode).toEqual(204);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { uuid: '123' } });
    });
  });
});
