const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @route   POST /api/n8n/trigger-csv-check
 * @desc    Checks PostgreSQL for empty/outdated campaigns and triggers N8N Telegram Alert
 */
router.post('/trigger-csv-check', async (req, res) => {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL no está configurada.' });
    }

    // Find the latest campaign in PostgreSQL
    const latestCampaign = await prisma.campaign.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let isEmpty = false;
    let isOutdated = false;
    let campaignName = 'Ninguna';
    let lastCampaignDate = 'Nunca';
    let totalContacts = 0;
    let hoursSinceLastCampaign = 0;

    if (!latestCampaign) {
      isEmpty = true;
      isOutdated = true;
    } else {
      campaignName = latestCampaign.nombre;
      lastCampaignDate = latestCampaign.createdAt.toISOString();
      totalContacts = latestCampaign.totalContacts;
      
      if (totalContacts === 0) {
        isEmpty = true;
      }
      
      const diffMs = Date.now() - new Date(latestCampaign.createdAt).getTime();
      hoursSinceLastCampaign = Math.floor(diffMs / (1000 * 60 * 60));
      // Outdated if older than 24 hours
      if (hoursSinceLastCampaign >= 24) {
        isOutdated = true;
      }
    }

    // Trigger N8N webhook with full diagnostic details
    const response = await axios.post(webhookUrl, {
      action: 'CHECK_CSV',
      isEmpty,
      isOutdated,
      campaignName,
      lastCampaignDate,
      totalContacts,
      hoursSinceLastCampaign,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Workflow de N8N disparado para chequear el CSV.',
      diagnostics: {
        isEmpty,
        isOutdated,
        campaignName,
        lastCampaignDate,
        totalContacts,
        hoursSinceLastCampaign
      },
      n8nResponse: response.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(502).json({ error: `N8N retornó un error: ${error.response.status} - ${error.response.statusText}` });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
