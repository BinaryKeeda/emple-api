import { date } from 'zod';
import Solution from '../../../../models/core/Solution.js';

export const getSolutions = async (_, args) => {
  try {
    const { userId, page = 1, search = '', limit = 10 } = args;

    if (search) {
      const solution = await Solution.findById(search).populate('quizId');

      // Get rank for this solution
      // const allSolutions = await Solution.find({
      //   quizId: solution.quizId._id,
      //   isSubmitted: true,
      //   isEvaluated: true,
      // }).sort({ score: -1 });
      
      // const rank = allSolutions.findIndex(s => s.userId.toString() === solution.userId.toString()) + 1;
      return {
        status: true,
        // data: [{ ...solution.toObject(), rank , totalSubmissions : allSolutions.length }],
        data:[solution],
        page: 0,
        limit: 0,
        total: 1
      };
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const query = {
      userId,
      isSubmitted: true,
      isEvaluated: true
    };

    const skip = (page - 1) * limit;

    const solutions = await Solution.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('quizId');
      
    const solutionsWithRank = await Promise.all(
      solutions.map(async sol => {
        const allSolutions = await Solution.find({
          quizId: sol.quizId._id,
          isSubmitted: true,
          isEvaluated: true
        }).sort({ score: -1 });
        const rank = allSolutions.findIndex(s => s.userId.toString() === sol.userId.toString()) + 1;

        return { ...sol.toObject(), rank , totalSubmissions: allSolutions.length};
      })
    );
    const count = await Solution.countDocuments(query);

    return {
      status: true,
      data: solutionsWithRank,
      totalItems: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };

  } catch (error) {
    console.error('Error in getSolutions:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch solutions'
    };
  }
};

