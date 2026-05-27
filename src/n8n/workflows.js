const axios = require('axios');
require('dotenv').config({ quiet: true });

const triggerN8nWorkflow = async (topic, eventData) => {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('N8N_WEBHOOK_URL is not defined. Skipping workflow trigger.');
      return;
    }

    // Call n8n webhook
    const response = await axios.post(webhookUrl, {
      topic,
      eventData,
      timestamp: new Date().toISOString()
    });

    console.log(`Successfully triggered n8n workflow for topic ${topic}`, response.data);
  } catch (error) {
    console.error('Error triggering n8n workflow:', error.message);
  }
};

module.exports = { triggerN8nWorkflow };
