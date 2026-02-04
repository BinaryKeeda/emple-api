export const schema = `#graphql
    type Options {
        _id:ID
        text: String,
        image: String,
        isCorrect:Boolean
    }
    type Question {
        _id: ID!
        question:String
        marks:Float
        category:String
        negative:Float
        image:String
        options:[Options]
        answer:String
    }
    type FunctionSignature {
        language: String
        signature: String
    }

    type Example {
        input: JSON!
        output: JSON!
        explanation: String
    }

    type TestCase {
        input: String!
        output: String!
        explanation: String
    }

    type PerformanceStats {
        bestTime: Float
        bestMemory: Float
        averageTime: Float
        averageMemory: Float
    }

    scalar JSON

    type Problem {
        _id: ID!
        title: String!
        description: String!
        difficulty: String!
        constraints: [String]
        topics: [String]
        hints: [String]
        examples: [Example]
        functionSignature: [FunctionSignature]
        testCases: [TestCase]
        performanceStats: PerformanceStats
        author: String
        createdAt: String
        updatedAt: String
        tags: [String]
        visibility: String
        submissionCount: Int
        acceptanceRate: Float
    }

    type Section {
        _id: ID!
        name: String!
        description: String
        sectionType: String
        questionSet: [Question]
        problemset: [Problem]
    }

    type Test {
        _id: ID!
        name: String!
        slug:String
        description: String
        duration: Int
        category: String
        isAvailable: Boolean
        sections: [Section]
        attempts:Int
    }

   type Quiz {
        _id: ID
        title: String
        category: String
        difficulty: String
        duration: Int
        rank: Int
        marks: Int
        questions:[Question]
        minimumScore: Int
        averageScore: Int
        highestScore: Int
        totalAttempts: Int
        hasAttempted:Int
        isAvailable: Boolean
        isSubmitted: Boolean
        slug:String
        createdAt:String

    }

    type QuizPagination {
        status: Boolean!
        data: [Quiz!]!
        page: Int!
        limit: Int!
        totalItems: Int!
        totalPages: Int!
    }
    type TestPagination {
        status: Boolean
        data: [Test!]
        page: Int
        limit: Int
        totalItems: Int
        totalPages: Int
    }
  

    type ResponseEntry {
        selected: [String]
        answer: String
    }

    type Solution {
        _id: ID
        userId: ID
        quizId: Quiz
        rank:Int
        totalSubmissions: Int
        attemptNo: Int
        response: JSON       # Use a scalar to store Map-like data
        ufmAttempts: Int
        score: Float
        isSubmitted: Boolean
        createdAt:String
    }

    type SolutionPagination {
        status:Boolean
        data:[Solution]
        page:Int
        limit:Int
        totalItems:Int
        totalPages:Int
    }

    type UserSolution {
        solved:Boolean,
        solution: Solution,
        quiz:Quiz,
        message:String
    }

    type CategoryStats {
        average: Float
        attempted: Int
    }

    type SolutionStats {
        totalQuizSolutions: Int
        totalTestSolutions: Int
        aptitude: CategoryStats
        miscellaneous: CategoryStats
        core: CategoryStats
        easy: CategoryStats
        medium: CategoryStats
        hard: CategoryStats
    }

    type Rank {
        _id: ID
        userId: ID
        points: Float
        solutions: SolutionStats
        timestamp: String
    }
    type RankedUser {
        userId: ID
        name: String
        university: String
        avatar:String
        points: Float
        rank: Int
    }

    type RankSummary {
        userId: ID
        university: String
        globalRank: Int
        universityRank: Int
        topGlobal: [RankedUser]
        topUniversity: [RankedUser]
        userRank:Rank
    }
    # ================================
    # Types
    # ================================

    type QuizAnswer {
        id: ID!
        selectedOption:[String]
    }

    type CodingAnswer {
        problemId: String
        userSolutionId: ID
    }

    type SectionResponse {
        sectionId: ID!
        sectionType: SectionType!
        quizAnswers: [QuizAnswer]
        codingAnswers: [CodingAnswer]
        totalQuestions: Int
        correctAnswers: Int
    }

    enum SectionType {
        Quiz
        Coding
    }

    type TestResponse {
        _id: ID!
        testId: ID!
        userId: ID!
        isSubmitted: Boolean!
        response: [SectionResponse]
        hasAgreed: Boolean!
        curr: Int
        attempt: Int
        createdAt: String
        updatedAt: String
        startedAt: String   
        endedAt: String       
        durationSpent: String   
        pausedAt: String  
        lastSeenAt: String 
    }

    
    type TestSolution {
        test:Test
        testResponse:TestResponse
    }
    type TestData {
      testResponseId: ID,
      testName:String,
    }
    type TestResponsePagination{
        data:[TestData]
        page:Int
        limit:Int
        totalItems:Int
        totalPages:Int
    }
    input QuizFilterInput {
      difficulty: String,
      sortBy: String,
      sortOrder: String,
      search:String
    }
    type Query {
        getQuizzes(
            page: Int = 1,
            limit: Int = 10,
            search: String,
            category: String,
            filters: QuizFilterInput
            userId: String!
        ): QuizPagination! ,
        getTests(
            page: Int = 1,
            limit: Int = 10,
            search: String,
            category: String,
            userId: String!
        ): TestPagination!,
        getUserSolution(
            slug:String!,
            userId:String!
        ):UserSolution,
        getRank(
            userId: ID!, university: String!
        ):RankSummary,
        getSolutions(
            page: Int = 1,
            limit: Int = 10,
            search: String,
            userId: String!
        ):SolutionPagination,
        getUserTestSolution(
            slug:String!,
            userId:String!,
            isPractice:Boolean
        ):TestSolution,
        getUserTestSolutions(
            page: Int = 1,
            limit: Int = 10,
            search: String,
            userId: String!
        ):TestResponsePagination
    }

`;