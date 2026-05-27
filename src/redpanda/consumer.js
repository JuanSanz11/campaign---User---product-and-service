const { Kafka, logLevel } = require('kafkajs');
const { triggerN8nWorkflow } = require('../n8n/workflows');
require('dotenv').config({ quiet: true });

const kafka = new Kafka({
  clientId: 'node-app-consumer',
  brokers: process.env.REDPANDA_BROKERS ? process.env.REDPANDA_BROKERS.split(',') : ['localhost:9092'],
  logLevel: logLevel.NOTHING,
});

const consumer = kafka.consumer({ groupId: 'audit-group' });

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['user-events', 'product-events', 'service-events'], fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      console.log(`[Audit Log] Topic: ${topic}, Event:`, event);
      
      // Trigger n8n workflow based on event
      await triggerN8nWorkflow(topic, event);
    },
  });
};

module.exports = { connectConsumer };
