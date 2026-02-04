import Quiz from '../../../models/core/Quiz.js';
import Solution from '../../../models/core/Solution.js';
import Rank from '../../../models/profile/Rank.js';

export const evaluateQuiz = async (job) => {
  // await mongoose.connect(process.env.URI);

  const { quizId, response, userId, submissionId } = job.data;

  const quiz = await Quiz.findById(quizId);
  const solution = await Solution.findById(submissionId);
  if (!quiz || !solution) throw new Error("Quiz or Solution not found");

  let score = 0;

  for (const question of quiz.questions) {
    const qid = question._id.toString();
    const userAnswer = response[qid];
    const correctOptions = question.options?.filter(opt => opt.isCorrect)?.map(opt => opt.text) || [];
    const marks = question.marks || 1;
    const negative = Math.abs(question.negative) || 0;

    if (correctOptions.length > 1) {
      if (Array.isArray(userAnswer)) {
        const isCorrect = userAnswer.length === correctOptions.length &&
          userAnswer.every(opt => correctOptions.includes(opt));
        score += isCorrect ? marks : -negative;
      }
    } else if (correctOptions.length === 1) {
      if (userAnswer === correctOptions[0]) score += marks;
      else if (userAnswer) score -= negative;
    } else {
      const correctText = question.answer?.trim().toLowerCase();
      if (typeof userAnswer === 'string' &&
          correctText &&
          userAnswer.trim().toLowerCase() === correctText) {
        score += marks;
      } else if (userAnswer) {
        score -= negative;
      }
    }
  }

  // ========== 1. Update Solution ==========
  solution.score = score;
  solution.response = response;
  solution.isSubmitted = true;
  solution.isEvaluated = true;
  await solution.save();

  // ========== 2. Update Quiz Stats ==========
  const prevAttempts = quiz.totalAttempts || 0;
  const prevAvg = quiz.averageScore || 0;
  const newTotal = prevAttempts + 1;
  const newAvg = ((prevAvg * prevAttempts) + score) / newTotal;
  const newHighest = Math.max(quiz.highestScore || 0, score);

  quiz.totalAttempts = newTotal;
  quiz.averageScore = newAvg;
  quiz.highestScore = newHighest;
  await quiz.save();

  // ========== 3. Update Rank ==========
  let rank = await Rank.findOne({ userId });
  if (!rank) {
    rank = new Rank({ userId });
  }

  // Points: add full score
  rank.points += score;

  // Quiz stats
  rank.solutions.totalQuizSolutions += 1;
  
  // Category-wise update
  const cat = quiz.category.toLowerCase(); // e.g., "aptitude"
  if (!rank.solutions[cat]) {
    rank.solutions[cat] = { average: 0, attempted: 0 };
  }
  const catObj = rank.solutions[cat];
  const catTotal = catObj.attempted;
  catObj.attempted += 1;
  catObj.average = ((catObj.average * catTotal) + score) / (catTotal + 1);

  // Difficulty-wise update
  const diff = quiz.difficulty.toLowerCase(); // e.g., "easy"
  console.log(diff);
  if (!rank.solutions[diff]) {
    rank.solutions[diff] = { average: 0, attempted: 0 };
  }
  const diffObj = rank.solutions[diff];
  const diffTotal = diffObj.attempted;
  diffObj.attempted += 1;

  diffObj.average = ((diffObj.average * diffTotal) + score) / (diffTotal + 1);
  console.log(rank.solutions);
  await rank.save();

  return { success: true, score };
};
