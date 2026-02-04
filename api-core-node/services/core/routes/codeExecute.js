import { Router } from "express";
import axios from 'axios';
import Problem from "../../../../models/test/Problem.js";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import { UserSolution } from "../../../../models/test/UserSolution.js";
import redis from "../../../../config/redisConn.js";

const codeEvalRouter = Router();

const getLanguageId = lang => {
  const map = {
    cpp: 54,
    c: 50,
    java: 62,
    python: 71
  }
  return map[lang] || 71
}
const encodeBase64 = str =>
  typeof str === 'string' ? btoa(unescape(encodeURIComponent(str))) : '';

const decodeBase64 = str =>
  typeof str === 'string' ? decodeURIComponent(escape(atob(str))) : '';


export const CODE_EXECUTION_API = process.env.EXECUTION_API;

export const headers = {
  "X-Auth-Token": "yourAuthTokenHere",
};

codeEvalRouter.post("/eval", async (req, res) => {
  try {
    const { code, language, problemId, isSubmit } = req.body;
    const cacheKey = `problem:${problemId}`;
    // console.log("Code Execution Request:", { code, language, problemId, isSubmit });
    if (!code || !language || !problemId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let problemData = await redis.get(cacheKey);
    let problem;

    if (problemData) {
      problem = JSON.parse(problemData);
    } else {
      problem = await Problem.findById(problemId).lean();
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }
      // Cache it for future
      await redis.set(cacheKey, JSON.stringify(problem));
    }
    const submissions = problem.testCases.map((test) => ({
      source_code: encodeBase64(code),
      language_id: getLanguageId(language),
      expected_output: encodeBase64(test.output.trim()),
      stdin: encodeBase64(test.input),
      cpu_time_limit: (problem?.timeLimit < 15) ? problem?.timeLimit : 1.5,
      memory_limit: 256000,
      expected_output: encodeBase64(test.output.trim()) // <-- Added
    }));
    // console.log("Submissions prepared:", submissions);
    const submitRes = await axios.post(
      `${CODE_EXECUTION_API}/submissions/batch?base64_encoded=true&wait=true`,
      { submissions },
      { headers }
    );
    // console.log("Submission response:", submitRes.data);
    const tokens = submitRes.data || [];
    res.json( tokens );
  } catch (e) {
    console.error(e.message);
    res.status(400).json({ message: "Error"  , error: e.message });
  }
});


codeEvalRouter.post('/fetch' , async(req,res) => {
  try{
    const {tokenStrings} = req.body;
    const data = await axios.get(`${CODE_EXECUTION_API}/submissions/batch?tokens=${tokenStrings.join(',')}&base64_encoded=true` , {
      headers
    })
    res.json(data.data);
  }catch (e){
    console.log(e)
    res.status(400).json({message: "Error"});
  }
})

codeEvalRouter.post('/submit', async (req, res) => {
  try {
    const {
      userId,
      problemId,
      responseId,
      sectionId,
      language,
      sourceCode,
      codeReview,
      passedTestCases,
      totalTestCases,
      executionTime,
      memoryUsed
    } = req.body;
    const sectionType  = "Coding";  
    // Validate required fields
    if (!userId || !problemId  || !language || !sourceCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sanitize code review
    const sanitizedReview = {
      indentation: codeReview?.indentation || 0,
      modularity: codeReview?.modularity || 0,
      variable_name_convention: codeReview?.variable_name_convention || 0,
      time_complexity: codeReview?.time_complexity || 0,
      space_complexity: codeReview?.space_complexity || 0
    };

    // Save the user's code submission
    const submission = new UserSolution({
      userId,
      responseId:responseId,
      problemId,
      language,
      code: sourceCode,
      codeReview: sanitizedReview,
      passedTestCases,
      totalTestCases,
      executionTime,
      memoryUsed
    });

    await submission.save();

    // Update the corresponding TestResponse
    const testSubmission = await TestResponse.findById(responseId);

    if (!testSubmission) {
      return res.status(404).json({ error: 'Test response not found' });
    }

    const problemKey = problemId.toString();
    const answerData = {
      [problemKey]: {
        language,
        code: sourceCode,
        executionTime,
        memoryUsed,
        passedTestCases,
        totalTestCases
      }
    };
    // console.log(answerData)

    if (testSubmission.response.length === testSubmission.curr) {
      // Add new section response
      testSubmission.response.push({
        sectionId,
        sectionType,
        codingAnswers: answerData,
        totalQuestions: -1,
        correctAnswers: -1
      });
    } else {
      // Update existing section
      const currSection = testSubmission.response[testSubmission.curr];
      if (!currSection.codingAnswers || currSection.codingAnswers.length === 0) {
        currSection.codingAnswers = [answerData]; // initialize with first answer
      } else {
        // Ensure the first object exists and is an object
        if (typeof currSection.codingAnswers[0] != 'object') {
          currSection.codingAnswers[0] = {};
        }

        // Add or overwrite the problemId key
        currSection.codingAnswers[0][problemKey] = {
          language,
          code: sourceCode,
          executionTime,
          memoryUsed,
          passedTestCases,
          totalTestCases
        };
        // console.log(currSection.codingAnswers)
        
      }
      

    }
    testSubmission.markModified('response');

    await testSubmission.save();

    res.status(201).json({
      message: 'Submission saved successfully',
      submissionId: submission._id
    });

  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});


export default  codeEvalRouter






