const { Kafka, logLevel } = require('kafkajs');
require('dotenv').config({ quiet: true });

const kafka = new Kafka({
  clientId: 'node-app-producer',
  brokers: process.env.REDPANDA_BROKERS ? process.env.REDPANDA_BROKERS.split(',') : ['localhost:9092'],
  logLevel: logLevel.NOTHING,
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const sendEvent = async (topic, event) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(event) }],
    });
    console.log(`Event sent to topic ${topic}:`, event);
  } catch (error) {
    console.error(`Error sending event to topic ${topic}:`, error);
  }
};

module.exports = { connectProducer, sendEvent };
