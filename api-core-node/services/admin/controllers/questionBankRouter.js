import Quiz from "../../../../models/core/Quiz.js";
import { QuestionBank } from "../../../../models/shared/questionBank.js";


export const addQuestionsToBank = async (req, res) => {
  const { bankId } = req.params;
  const newData = req.body;

  try {
    const bank = await QuestionBank.findById(bankId);
    if (!bank) return res.status(404).json({ error: 'Question Bank not found' });

    // Normalize existing questions to a Set for fast lookup
    const existingQuestions = new Set(
      bank.questions.map(q => q.question.trim().toLowerCase())
    );

    // Handle both single object and array inputs
    const incomingQuestions = Array.isArray(newData) ? newData : [newData];

    // Filter out duplicates based on question text
    const uniqueNewQuestions = incomingQuestions.filter(q => {
      const normalized = q.question.trim().toLowerCase();
      return !existingQuestions.has(normalized);
    });

    // If no new unique questions found
    if (uniqueNewQuestions.length === 0) {
      return res.status(409).json({ message: 'All questions already exist' });
    }

    // Push only unique questions
    bank.questions.push(...uniqueNewQuestions);
    await bank.save();

    res.status(201).json({
      message: `${uniqueNewQuestions.length} question(s) added successfully`,
      totalQuestions: bank.questions.length,
      addedQuestions: uniqueNewQuestions,
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

// Paginated (infinite scroll) question fetch
export const getQuestionBankQuestions = async (req, res) => {
  const { bankId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const bank = await QuestionBank.findById(bankId).lean(); // lean improves performance
    if (!bank) return res.status(404).json({ error: 'Bank not found' });

    const totalQuestions = bank.questions.length;

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedQuestions = bank.questions.slice(startIndex, endIndex);

    const hasMore = endIndex < totalQuestions;

    res.json({
      bankDetails: {
        _id: bank._id,
        name: bank.name,
        type: bank.type,
        category: bank.category,
        totalQuestions,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
      },
      questions: paginatedQuestions,
      hasMore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const addQuestionBank = async (req,res) => { 
  const { name, type, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name, type, and category are required' });
  }

  try {
    const bank = new QuestionBank({
      name,
      category,
      questions: [] // initial empty array
    });

    await bank.save();

    res.status(201).json({ message: 'Question bank created', bank });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}



/*

req.user.role   
requiredRole == incoiming role
 /rout

*/