import mongoose from "mongoose";
import Rank from "../../../../models/profile/Rank.js";

export const getRank = async (_, { userId, university }) => {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);

    // Check if user has a rank
    const userRankDoc = await Rank.findOne({ userId: objectId }).lean();
    const userHasRank = !!userRankDoc;

    let globalRankValue = null;
    let universityRankValue = null;
    let userPoints = null;

    if (userHasRank) {
      // Global Rank of current user
      const [globalRankData] = await Rank.aggregate([
        {
          $setWindowFields: {
            sortBy: { points: -1 },
            output: { rank: { $rank: {} } }
          }
        },
        { $match: { userId: objectId } },
        { $project: { _id: 0, globalRank: "$rank", points: 1 } } // ✅ include points
      ]);
      globalRankValue = globalRankData?.globalRank ?? null;
      userPoints = globalRankData?.points ?? null;

      // University Rank of current user
      const [universityRankData] = await Rank.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $match: {
            $expr: {
              $eq: [
                { $toLower: "$user.university" },
                university.toLowerCase()
              ]
            }
          }
        },
        {
          $setWindowFields: {
            sortBy: { points: -1 },
            output: { rank: { $rank: {} } }
          }
        },
        { $match: { userId: objectId } },
        { $project: { _id: 0, universityRank: "$rank", points: 1 } } // ✅ include points
      ]);
      universityRankValue = universityRankData?.universityRank ?? null;
    }

    // Top 3 Global
    const topGlobal = await Rank.aggregate([
      {
        $setWindowFields: {
          sortBy: { points: -1 },
          output: { rank: { $rank: {} } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: 1,
          points: 1,
          rank: 1,
          name: "$user.name",
          university: "$user.university",
          avatar: "$user.avatar"
        }
      },
      { $match: { rank: { $lte: 3 } } },
      { $limit: 3 }
    ]);

    // Top 3 University
    const topUniversity = await Rank.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $match: {
          $expr: {
            $eq: [
              { $toLower: "$user.university" },
              university.toLowerCase()
            ]
          }
        }
      },
      {
        $setWindowFields: {
          sortBy: { points: -1 },
          output: { rank: { $rank: {} } }
        }
      },
      {
        $project: {
          userId: 1,
          points: 1,
          rank: 1,
          name: "$user.name",
          university: "$user.university",
          avatar: "$user.avatar"
        }
      },
      { $match: { rank: { $lte: 3 } } },
      { $limit: 3 }
    ]);

    // console.log(topGlobal)x
    return {
      userId,
      university,
      globalRank: globalRankValue,
      universityRank: universityRankValue,
      points: userPoints, // ✅ return user points as well
      topGlobal, 
      topUniversity,
      userRank: userRankDoc || null
    };
  } catch (err) {
    console.error("Error in getRank:", err);
    throw new Error("Failed to fetch rank summary.");
  }
};
