const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Email validation helper
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// GET /api/campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/campaigns/:id
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { uuid: req.params.id },
      include: {
        contacts: {
          orderBy: { nombre: 'asc' }
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 100 // Limit to last 100 logs
        }
      }
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/campaigns/:id/status
exports.getCampaignStatus = async (req, res) => {
  try {
    // Manual sends do not have a real campaign UUID.
    // Return a running status so the n8n flow can continue sending the manual message.
    if (req.params.id === 'MANUAL') {
      return res.json({ status: 'RUNNING' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { uuid: req.params.id },
      select: { status: true }
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ status: campaign.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/campaigns/upload
exports.createCampaign = async (req, res) => {
  try {
    const { nombre, csvData } = req.body;
    
    if (!nombre || !csvData) {
      return res.status(400).json({ error: 'Nombre and csvData are required' });
    }

    // Simple CSV parser
    const lines = csvData.split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file must have header and at least one data row' });
    }

    // Find headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('nombre');
    const emailIndex = headers.indexOf('email');

    if (nameIndex === -1 || emailIndex === -1) {
      return res.status(400).json({ 
        error: 'CSV headers must include "nombre" and "email" columns' 
      });
    }

    const contactsList = [];
    let totalCount = 0;
    let validCount = 0;
    const emailsSet = new Set(); // Para detectar duplicados

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting
      const cols = line.split(',').map(c => c.trim());
      if (cols.length < Math.max(nameIndex, emailIndex) + 1) continue;

      const rawName = cols[nameIndex];
      const rawEmail = cols[emailIndex];

      // Validate email format and check for duplicates
      const isValid = validateEmail(rawEmail);
      
      // Skip if email is invalid or is a duplicate
      if (!isValid || emailsSet.has(rawEmail.toLowerCase())) {
        totalCount++;
        continue;
      }

      totalCount++;
      validCount++;
      emailsSet.add(rawEmail.toLowerCase());

      contactsList.push({
        nombre: rawName || 'Sin Nombre',
        email: rawEmail,
        isValid: true,
        status: 'PENDING'
      });
    }

    // Create Campaign and contacts in DB
    // Settings for batch email sending: 10 emails every 2 minutes, 1-hour pause
    const campaign = await prisma.campaign.create({
      data: {
        nombre,
        status: 'RUNNING',
        batchSize: 10,           // 10 emails per batch
        batchIntervalHours: 0,   // Not used, we use minutes
        messageLimit: 1,         // Only 1 email per contact
        messageIntervalHours: 0, // Not used, we use minutes in N8N
        totalContacts: totalCount,
        validContacts: validCount,
        contacts: {
          create: contactsList
        }
      },
      include: {
        contacts: true
      }
    });

    // Trigger N8N Webhook with campaign ID and valid contacts only
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl && validCount > 0) {
      try {
        const validContactsOnly = campaign.contacts.filter(c => c.isValid);
        
        // Asynchronously call N8N so we don't block backend response
        axios.post(webhookUrl, {
          campaignId: campaign.uuid,
          nombre: campaign.nombre,
          batchSize: 10,           // 10 emails per batch
          batchIntervalMinutes: 2, // 2 minutes between batches after first 10
          pauseHours: 1,           // 1 hour pause after first 10 emails
          contacts: validContactsOnly
        }).catch(err => {
          console.error('Failed to trigger N8N Webhook async:', err.message);
        });
      } catch (err) {
        console.error('Error preparing N8N Webhook trigger:', err.message);
      }
    } else {
      console.warn('N8N_WEBHOOK_URL is not defined or no valid contacts found. Skipping N8N trigger.');
    }

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/campaigns/:id/pause
exports.pauseCampaign = async (req, res) => {
  try {
    const updated = await prisma.campaign.update({
      where: { uuid: req.params.id },
      data: { status: 'PAUSED' }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/campaigns/:id/resume
exports.resumeCampaign = async (req, res) => {
  try {
    const updated = await prisma.campaign.update({
      where: { uuid: req.params.id },
      data: { status: 'RUNNING' }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/campaigns/:id/restart
exports.restartCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Reset contacts status to PENDING
    await prisma.campaignContact.updateMany({
      where: { campaignUuid: campaignId },
      data: { status: 'PENDING' }
    });

    // Delete existing logs
    await prisma.campaignLog.deleteMany({
      where: { campaignUuid: campaignId }
    });

    // Update campaign status
    const updated = await prisma.campaign.update({
      where: { uuid: campaignId },
      data: { status: 'RUNNING' },
      include: { contacts: true }
    });

    // Re-trigger N8N Webhook
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      const validContactsOnly = updated.contacts.filter(c => c.isValid);
      if (validContactsOnly.length > 0) {
        axios.post(webhookUrl, {
          campaignId: updated.uuid,
          nombre: updated.nombre,
          batchSize: 10,           // 10 emails per batch
          batchIntervalMinutes: 2, // 2 minutes between batches
          pauseHours: 1,           // 1 hour pause after first 10 emails
          contacts: validContactsOnly
        }).catch(err => {
          console.error('Failed to re-trigger N8N Webhook async:', err.message);
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/campaigns/:id/log (called from N8N)
exports.logCampaignEvent = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { contactId, messageIndex, channel, status, message } = req.body;

    // 1. Create Log Entry
    const log = await prisma.campaignLog.create({
      data: {
        campaignUuid: campaignId,
        contactUuid: contactId || null,
        messageIndex: parseInt(messageIndex) || 1,
        channel: channel || 'UNKNOWN',
        status: status || 'SUCCESS',
        message: message || ''
      }
    });

    // 2. Update Contact status if contactId is provided
    if (contactId) {
      await prisma.campaignContact.update({
        where: { uuid: contactId },
        data: {
          status: status === 'SUCCESS' ? 'SENT' : 'FAILED'
        }
      });
    }

    // 3. Check if all contacts in campaign have been fully processed.
    // If they have completed all messages, or if this is the final message log for all, 
    // we can mark the campaign as COMPLETED.
    // (In this simple code, we just return the logged entry and let N8N handle completion or leave it running)
    
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/campaigns/send-manual
exports.sendManual = async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido para envío manual.' });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'El email no es válido.' });
    }

    const contact = {
      nombre: nombre || 'Cliente',
      email: email,
      isValid: true,
      status: 'PENDING'
    };

    // Try to trigger the dedicated manual N8N webhook.
    // If manual webhook is not set, fall back to the regular campaign webhook for compatibility.
    const webhookUrl = process.env.N8N_MANUAL_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    let n8nStatus = 'N8N_NOT_CONFIGURED';
    let n8nResponse = null;

    if (!webhookUrl) {
      return res.status(500).json({ success: false, error: 'N8N_MANUAL_WEBHOOK_URL o N8N_WEBHOOK_URL no está configurada. No se puede ejecutar el envío manual.', contact });
    }

    const payload = {
      nombre: `Envío Manual - ${contact.nombre}`,
      batchSize: 1,
      contacts: [contact],
      mensajePersonalizado: mensaje || null
    };

    try {
      const response = await axios.post(webhookUrl, payload);
      n8nStatus = 'TRIGGERED';
      n8nResponse = response.data;
    } catch (n8nError) {
      const statusCode = n8nError.response?.status;
      const errorMessage = n8nError.response
        ? `N8N respondió ${statusCode}: ${JSON.stringify(n8nError.response.data)}`
        : `Fallo de conexión: ${n8nError.code || n8nError.message}`;

      // If the manual webhook path is registered but not available, try the regular campaign-start webhook as a fallback.
      if (process.env.N8N_MANUAL_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL && webhookUrl === process.env.N8N_MANUAL_WEBHOOK_URL && statusCode === 404) {
        try {
          const fallbackResponse = await axios.post(process.env.N8N_WEBHOOK_URL, payload);
          n8nStatus = 'TRIGGERED_FALLBACK';
          n8nResponse = fallbackResponse.data;
        } catch (fallbackError) {
          const fallbackMessage = fallbackError.response
            ? `Fallback N8N respondió ${fallbackError.response.status}: ${JSON.stringify(fallbackError.response.data)}`
            : `Fallback fallo de conexión: ${fallbackError.code || fallbackError.message}`;
          console.warn(`⚠️  Manual webhook failed and fallback also failed: ${fallbackMessage}`);
          return res.status(502).json({
            success: false,
            error: 'Error al ejecutar N8N. Revisa la URL del webhook y que N8N esté activo.',
            details: `${errorMessage}; fallback: ${fallbackMessage}`,
            contact
          });
        }
      } else {
        console.warn(`⚠️  N8N webhook call failed: ${errorMessage}`);
        return res.status(502).json({
          success: false,
          error: 'Error al ejecutar N8N. Revisa la URL del webhook y que N8N esté activo.',
          details: errorMessage,
          contact
        });
      }
    }

    console.log(`📨 Manual send: ${contact.nombre} | email: ${contact.email} | n8n: ${n8nStatus}`);
    res.status(200).json({
      success: true,
      message: `Solicitud registrada para ${contact.nombre}. Mensaje enviado via N8N.`,
      contact,
      n8nStatus,
      n8nResponse
    });
  } catch (error) {
    if (error.response) {
      return res.status(502).json({ error: `Error al contactar N8N: ${error.response.status} - ${error.response.statusText}` });
    }
    res.status(500).json({ error: error.message });
  }
};
