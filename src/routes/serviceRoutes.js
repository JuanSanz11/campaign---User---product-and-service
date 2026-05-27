const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: API para gestión de servicios
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Obtiene todos los servicios
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Lista de servicios
 */
router.get('/', serviceController.getServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obtiene un servicio por ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del servicio
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', serviceController.getService);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Crea un nuevo servicio
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *       400:
 *         description: Error en la creación
 */
router.post('/', serviceController.createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Actualiza un servicio
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 */
router.put('/:id', serviceController.updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Elimina un servicio
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Servicio eliminado
 */
router.delete('/:id', serviceController.deleteService);

module.exports = router;
