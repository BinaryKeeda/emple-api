import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

const codeRouter = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to review the code
async function reviewCode(req, res) {
  const { sourceCode , problem} = req.body; // Get the source code from the request body
  // console.log(problem)

  if (!sourceCode) {
    return res.status(400).json({ error: "Source code is required" });
  }

  try {
    // Get the generative model for code review
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare the prompt to analyze the source code
const prompt = `
Problem name: ${problem}

Analyze the following code and return a JSON object with the structure below. **Only evaluate non-empty, meaningful functions that contain actual logic or contribute to functionality.**

- Ignore:
  - The main function (if present)
  - Trivial, placeholder, or empty functions
  - Functions that do not affect the outcome or are unused

Only consider code that would pass test cases (i.e., logically complete and syntactically correct functions).

Return only the JSON in this format:

{
  "indentation": score (0 or 1),       
  "modularity": score (0 or 1),        
  "variable_name_convention": score (0 or 1),
  "time_complexity": score (0 or 1),   
  "space_complexity": score (0 or 1),  
  "finalScore": score (0 or 5)          
}

**Return only the JSON.** Do not explain anything. Here's the code:

${sourceCode}
`;



    // Requesting the AI model for content generation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response and return it
    try {
      const reviewResult = text;
      return res.json({data:reviewResult}); // Send the result back as JSON
    } catch (err) {
      console.error("Could not parse Gemini response:", text);
      return res.status(500).json({ error: "Error parsing Gemini response" });
    }
  } catch (error) {
    console.error("Error during code review:", error);
    return res.status(500).json({ error:error });
  }
}



// Define the POST route for /code
codeRouter.post('/review', reviewCode);
// codeRouter.post('/run/code' , saveCodeSubmission);
// codeRouter.post('/submit/code' , saveCodeSubmission);

export default codeRouter;




// controllers/submit.controller.js


// export const saveCodeSubmission = async (req, res) => {
//   try {
//     const {
//       userId,
//       problemId,
//       testId,
//       language,
//       sourceCode,
//       codeReview,
//       passedTestCases = 0,
//       totalTestCases = 0,
//       executionTime,
//       memoryUsed
//     } = req.body;

//     if (!userId || !problemId || !testId || !language || !sourceCode) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const sanitizedReview = {
//       indentation: codeReview?.indentation || 0,
//       modularity: codeReview?.modularity || 0,
//       variable_name_convention: codeReview?.variable_name_convention || 0,
//       time_complexity: codeReview?.time_complexity || 0,
//       space_complexity: codeReview?.space_complexity || 0
//     };

//     const submission = new UserSolution({
//       userId,
//       testId,
//       problemId,
//       language,
//       code: sourceCode,
//       codeReview: sanitizedReview,
//       passedTestCases,
//       totalTestCases,
//       executionTime,
//       memoryUsed
//     });

//     await submission.save();

//     res.status(201).json({
//       message: 'Submission saved successfully',
//       submissionId: submission._id
//     });
//   } catch (err) {
//     console.error('Submission error:', err);
//     res.status(500).json({ error: 'Failed to save submission' });
//   }
// };
