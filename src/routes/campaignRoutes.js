const express = require('express');
const router = express.Router ? express.Router() : require('express').Router();
const campaignController = require('../controllers/campaignController');

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: API para gestión de campañas de mensajería
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Obtiene todas las campañas
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: Lista de campañas
 */
router.get('/', campaignController.getCampaigns);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Obtiene el detalle de una campaña por UUID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos completos de la campaña
 */
router.get('/:id', campaignController.getCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/status:
 *   get:
 *     summary: Obtiene el estado actual de una campaña
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de la campaña (RUNNING, PAUSED, etc.)
 */
router.get('/:id/status', campaignController.getCampaignStatus);

/**
 * @swagger
 * /api/campaigns/upload:
 *   post:
 *     summary: Crea una nueva campaña subiendo un CSV como texto
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - csvData
 *             properties:
 *               nombre:
 *                 type: string
 *               csvData:
 *                 type: string
 *               batchSize:
 *                 type: integer
 *               batchIntervalHours:
 *                 type: integer
 *               messageLimit:
 *                 type: integer
 *               messageIntervalHours:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Campaña creada e iniciada
 */
router.post('/upload', campaignController.createCampaign);

/**
 * @swagger
 * /api/campaigns/send-manual:
 *   post:
 *     summary: Envía un email manual a un contacto individual
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               mensaje:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje enviado exitosamente
 */
router.post('/send-manual', campaignController.sendManual);

/**
 * @swagger
 * /api/campaigns/{id}/pause:
 *   post:
 *     summary: Pausa una campaña activa
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaña pausada
 */
router.post('/:id/pause', campaignController.pauseCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/resume:
 *   post:
 *     summary: Reanuda una campaña pausada
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaña reanudada
 */
router.post('/:id/resume', campaignController.resumeCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/restart:
 *   post:
 *     summary: Reinicia una campaña, reseteando contactos y logs de envíos
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaña reiniciada y re-ejecutada en N8N
 */
router.post('/:id/restart', campaignController.restartCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/log:
 *   post:
 *     summary: Registra un evento de envío desde N8N
 *     tags: [Campaigns]
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
 *             required:
 *               - messageIndex
 *               - channel
 *               - status
 *             properties:
 *               contactId:
 *                 type: string
 *               messageIndex:
 *                 type: integer
 *               channel:
 *                 type: string
 *               status:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Log registrado con éxito
 */
router.post('/:id/log', campaignController.logCampaignEvent);

module.exports = router;
