
import Quiz from '../../../../models/core/Quiz.js';
export const getAllQuiz = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search || "";
        const skip = (page - 1) * limit;

        const query = search ? { title: { $regex: search, $options: "i" } } : {};

        const [quizzes, totalItems] = await Promise.all([
            Quiz.find(query)
                .skip(skip)
                .limit(limit)
                .populate({ path: 'creator', select: '-password' })
                .lean(),
            Quiz.countDocuments(query),
        ]);

        const response = {
            status: true,
            data: quizzes,
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        };

        res.status(200).json(response);
    } catch (error) {
        sendRes("Failed to fetch quizzes", 500, false, res);
    }
};