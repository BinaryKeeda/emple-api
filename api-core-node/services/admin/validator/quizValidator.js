import { z } from 'zod'
export const quizSchema = z.object({
    creator: z.string().nonempty("Creator is required"),
    title: z.string().nonempty("Title is required"),
    duration: z.number().positive("Duration must be a positive number"),
    questions: z.array(z.object({
        question: z.string().nonempty("Question is required"),
        marks: z.number().positive("Marks must be a positive number"),
        category: z.string().nonempty("Category is required"),
        image: z.string().optional(),
        answer: z.string().optional(),
    })).optional(),
    marks: z.number().positive("Marks must be a positive number"),
    category: z.string().optional(),
    tags: z.string().optional(),
    difficulty: z.string().optional(),
});

export const questionSchema = z.object({
    question: z.string().nonempty("Question is required"),
    // quizId: z.string().nonempty("Quiz ID is required"),
    marks: z.number().positive("Marks must be a positive number"),
    negative: z.number(),
    category: z.string().nonempty("Category is required"),
    image: z.string().optional(),
    answer: z.string().optional(),
    options: z.array(
        z.object({
            text: z.string(),
            isCorrect: z.boolean()
        })
    ).optional()
});