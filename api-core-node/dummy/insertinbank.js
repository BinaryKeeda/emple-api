import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import { QuestionBank } from '../../models/shared/questionBank.js';
import { data } from './data.js';

configDotenv();

export const run = async () => {
  try {
    console.log(`🛠️ Total questions to insert: ${data.length}`);

    // Validate each question before pushing to DB
    for (let i = 0; i < data.length; i++) {
      const question = data[i];
      const singleBank = new QuestionBank({
        name: 'Core Subjects Main Set',
        category: 'Core',
        questions: [question]
      });

      try {
        await singleBank.validate(); // This does not write to DB
      } catch (validationError) {
        console.error(`❌ Validation failed at question index ${i}:`, question);
        console.error(`🧨 Error:`, validationError.message);
        throw new Error('Aborting due to validation error.');
      }
    }

    // Save the full set after validating
    const newBank = new QuestionBank({
      name: 'Core Main Bank',
      category: 'Core',
      questions: data
    });

    await newBank.save();
    console.log('✅ Successfully seeded aptitude questions to QuestionBank');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during seeding:', err.message || err);
    process.exit(1);
  }
};
