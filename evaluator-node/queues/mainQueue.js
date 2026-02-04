import { Queue } from 'bullmq';
import { redisConnection } from '../../config/config.js';

const defaultOptions = {
  connection: redisConnection,
  defaultJobOptions: {
     removeOnComplete: {
      delay: 10000, //  keep job for 10 seconds after completion
    },     // auto-remove successful jobs (boolean or number)
    removeOnFail: 1000,           // keep last 1000 failed jobs, remove older
    attempts: 3,                  // retry jobs on failure
    backoff: {
      type: 'exponential',
      delay: 5000,               // wait 5 seconds before retry
    },
  },
};


export const createQueue = (name) => new Queue(name, defaultOptions);

export const mainQueue = createQueue('mainQueue');
export const campusQueue = createQueue('campusQueue');