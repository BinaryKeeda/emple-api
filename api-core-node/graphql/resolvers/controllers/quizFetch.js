
import Solution from '../../../../models/core/Solution.js';
import Quiz from '../../../../models/core/Quiz.js';
import mongoose from 'mongoose';
import Users from '../../../../models/core/User.js';
import { SectionMember } from '../../../../models/shared/memeber.js';

export const getUserQuizes = async (_, args) => {
  try {
    console.log("Called");
    const { filters = {}, page = 1, limit = 10, category = '', userId } = args;

    if (!userId) {
      throw new Error('User ID is required');
    }
    // console.log(args);
    const pageNum = Math.max(page, 1);
    const limitNum = Math.min(limit, 100);
    const skip = (pageNum - 1) * limitNum;

    const { difficulty, sortBy = 'createdAt', sortOrder = 'desc' ,search = " "  } = filters;

    const queryFilter = {
      ...(search ? { title: { $regex: search, $options: 'i' } } : {}),
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}), 
      isAvailable: true,
       isGroup : false
    };
    console.log(queryFilter)

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const sortStage = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const result = await Quiz.aggregate([
      { $match: queryFilter },
      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limitNum },
            {
              $lookup: {
                from: 'solutions',
                let: { quizId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$quizId', '$$quizId'] },
                          { $eq: ['$userId', userObjectId] },
                          { $eq: ['$isSubmitted', true] }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: -1 } }
                ],
                as: 'userSolutions'
              }
            },
            {
              $addFields: {
                hasAttempted: { $gt: [{ $size: '$userSolutions' }, 0] },
                totalAttempts: { $size: '$userSolutions' },
                isSubmitted: {
                  $cond: [
                    { $gt: [{ $size: '$userSolutions' }, 0] },
                    true,
                    false
                  ]
                }
              }
            },
            {
              $project: {
                userSolutions: 0,
                questions: 0
              }
            }
          ],
          totalCount: [
            { $match: queryFilter },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const quizzes = result[0].data;
    const totalItems = result[0].totalCount[0]?.count || 0;

    return {
      status: true,
      data: quizzes,
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum)
    };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch quizzes');
  }
};


export const getUserSolution = async (_,args) => {


    const {slug , userId} = args; 
    try {
        if(!userId || !slug) {
            throw new Error('Missing Credentials');
        }

        const user = await Users.findById(userId);
        const quiz = await Quiz.findOne({slug});

        const sectionId = quiz.sectionId;
        const isUserInSection = await SectionMember.findOne({userId , section:sectionId});
        if(sectionId && !isUserInSection) return {message: "Unauthorized to attempt"}
        if (!quiz && userId) {
            throw new Error('Quiz not found');
        }
        const userSolution = await Solution.findOne({quizId:quiz._id, userId});
        if(userSolution?.isSubmitted) {
            return {
                solved:true,
                solution: userSolution,
                message: 'Solution submitted'
            }
        }
        else if(!userSolution){
          if(user.coins < 5) {
            throw new Error('Insufficient coins to attempt the quiz');
            return {message: "Insufficient coins to attempt the quiz"}
          }
            const newSolution = new Solution({
                quizId: quiz._id,
                userId,
                isSubmitted: false,
                attemptNo:1
                });
            await newSolution.save();
            user.coins -= 5; // Deduct 5 coins for quiz attempt
            await user.save();
            return {
                solved:false,
                solution: newSolution,
                quiz:quiz,
                message: 'Solution created'
            }
        }
        else{
            return {
                solved:false,
                solution: userSolution,
                quiz:quiz,
                message: 'Solution exists'
            }
        }
    } catch (error) {
        console.log(error);
        throw  error;
    }
}