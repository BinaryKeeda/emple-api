import { Worker } from "bullmq";
import { redisConnection } from "../../config/config.js";
import mongoose from "mongoose";
import {configDotenv} from 'dotenv'
import { examEvaluator, testEvaluator } from "./helpers/campusEvaluator.js";
configDotenv();
await mongoose.connect(process.env.URI)

const campusWorker = new Worker(
  'campusQueue',
  async (job) => {
    // Your job processing logic here
    switch(job.name) {
      case 'evalExam': 
        examEvaluator(job);
        break;
      case 'evalTest': 
        testEvaluator(job);
  }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Adjust concurrency based on your needs
    autorun: true, // Automatically start processing jobs
    
  }
);
campusWorker.on('completed', (job) => {
  console.log(`Job ${job.id} of type ${job.name} completed`);
});

campusWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

campusWorker.on('error', (err) => {
  console.error('Worker error:', err);
});



export default campusWorker;
