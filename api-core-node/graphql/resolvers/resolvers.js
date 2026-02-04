import { getUserTestSolution, getUserTestSolutions } from './controllers/getUserTestSolution.js';
import { getUserQuizes, getUserSolution } from './controllers/quizFetch.js';
import { getRank } from './controllers/rankFetch.js';
import { getSolutions } from './controllers/solutionFetch.js';
import { getUserTest } from './controllers/testFetch.js';

export const resolver = {
  Query: {
    getQuizzes:getUserQuizes ,
    getTests:getUserTest,
    getUserSolution:getUserSolution ,
    getRank:getRank,
    getSolutions:getSolutions,
    getUserTestSolution:getUserTestSolution,
    getUserTestSolutions:getUserTestSolutions,
  }
};
