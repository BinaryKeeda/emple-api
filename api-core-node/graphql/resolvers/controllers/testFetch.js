import mongoose from 'mongoose';
import { Test } from '../../../../models/test/TestSchema.js';
import { TestResponse } from '../../../../models/test/TestResponse.js';
export const getUserTest =  async (_, args) => {
      try {
        const userId = args.userId;
        const page = parseInt(args.page) || 1;
        const limit = parseInt(args.limit) || 10;
        const skip = (page - 1) * limit;

        const category = args.category || null;
        const searchQuery = args.search || null;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ status: false, message: "Invalid userId" });
        }

        // ✅ Build dynamic filter
        const filter = { isAvailable: true };
        if (category) {
          filter.category = category;
        }
        if (searchQuery) {
          filter.$or = [
            { name: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } }
          ];
        }

        const [totalTests, tests] = await Promise.all([
          Test.countDocuments(filter),
          Test.find(filter).skip(skip).limit(limit).lean()
        ]);

        // ✅ Aggregate user attempt counts per test
        const attemptCounts = await TestResponse.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              isSubmitted: true
            }
          },
          {
            $group: {
              _id: "$testId",
              attempts: { $sum: 1 }
            }
          }
        ]);

        // ✅ Use Map for faster lookup
        const attemptMap = new Map();
        attemptCounts.forEach(({ _id, attempts }) => {
          attemptMap.set(_id.toString(), attempts);
        });

        // ✅ Combine tests with attempt info
        const result = tests.map(test => {
        const attempts = attemptMap.get(test._id.toString()) || 0;
          return {
            _id: test._id,
            slug:test.slug,
            name: test.name,
            description: test.description,
            duration: test.duration,
            isAvailable: test.isAvailable,
            sections: test.sections?.length || 0,
            category: test.category || null,
            attempts,
            canAttempt: attempts < 1
          };
        });

        // console.log(data)/
        return {
          status: true,
          data: result,
          total: totalTests,
          page,
          limit,
          totalPages: Math.ceil(totalTests / limit)
        }

      } catch (error) {
        console.log(error)
        return { status: false, message: "Server error" };
      }
    }