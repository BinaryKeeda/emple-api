import { Worker } from 'bullmq';
import os from 'os';
import { redisConnection } from '../../config/config.js';
import { mailSender } from './helpers/mailSender.js';
import { evaluateQuiz } from './helpers/quizEvaluator.js';
import { submitSectionResponse } from './helpers/submitSection.js';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
configDotenv();
const cpuCount = os.cpus().length;
const concurrency = Math.floor(cpuCount * 0.7); // 70% of cores

await mongoose.connect(process.env.URI);

const worker = new Worker(
  'mainQueue',
  async (job) => {
    switch (job.name) {
      case 'testEval': submitSectionResponse(job);
        break;

      case 'quizEval': evaluateQuiz(job);
        break;

      case 'sendMail': mailSender(job);
      break;
      default:
        console.warn(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} of type ${job.name} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

