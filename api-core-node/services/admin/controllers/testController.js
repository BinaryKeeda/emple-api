import { z } from 'zod'
import { Test } from '../../../../models/test/TestSchema.js'
import mongoose from 'mongoose'
import problemSchema from '../validator/problemValidator.js'

// -------------------------
// Zod Schemas
// -------------------------
export const optionSchema = z.object({
  text: z.string().optional(),
  image: z.string().optional(),
  isCorrect: z.boolean()
})

export const questionSchema = z.object({
  question: z.string().min(1),
  image: z.string().optional(),
  marks: z.number().min(0),
  negative: z.number().min(0).optional(),
  topic: z.string().optional(),
  category: z.enum(['MCQ', 'MSQ', 'Text']),
  answer: z.string().optional(),
  options: z.array(optionSchema).optional()
})

const sectionSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  sectionType: z.enum(['Quiz', 'Coding'])
})

const createTestSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  duration: z.number().min(1),
  visibility: z.enum(['private', 'public', 'group']),
  category: z.enum(['Placements', 'Gate'])
})

// Add Question to Section in bulk
const bulkQuestionSchema = z.array(questionSchema)
// -------------------------
// GET Test
export const getTestById = async (req, res) => {
  try {
    const { id:testId } = req.params

    const test = await Test.findById(testId).populate({
      path: 'sections.problemset',
    })
    if (!test) return res.status(404).json({ error: 'Test not found' })

    res.status(200).json({ message: 'Test fetched', data: test })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// -------------------------
// Create Test
// -------------------------
export const createTest = async (req, res) => {
  try {
    const validated = createTestSchema.parse(req.body)
    const test = new Test(validated)
    await test.save()
    res.status(201).json({ message: 'Test created', data: test._id })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors })
    res.status(500).json({ error: error.message })
  }
}

// -------------------------
// Update Test 
// -------------------------
export const updateTestById = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const updatedTest = await Test.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedTest) {
      return res.status(404).json({ message: 'Test not found' })
    }

    res.json({message:"Test Updated"  , data:updatedTest})
  } catch (error) {
    console.error('Update error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
// -------------------------
// Add Section
// PATCH /tests/:testId/sections
// -------------------------
export const addSectionToTest = async (req, res) => {
  try {
    const { testId } = req.params
    const validated = sectionSchema.parse(req.body)

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    test.sections.push(validated)
    await test.save()

    res.status(200).json({ message: 'Section added', data: test })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors })
    res.status(500).json({ error: error.message })
  }
}

// -------------------------
// Add Question to Section
// PATCH /tests/:testId/sections/:sectionIndex/questions
// -------------------------
export const addQuestionToSection = async (req, res) => {
  try {
    const { testId, sectionId } = req.params
    const validated = questionSchema.parse(req.body)

    if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ error: 'Invalid test or section ID' })
    }

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const section = test.sections.id(sectionId)
    if (!section) return res.status(404).json({ error: 'Section not found' })

    // Manual MCQ/MSQ rules
    if (validated.category !== 'Text') {
      const options = validated.options || []
      const correctCount = options.filter(o => o.isCorrect).length
      if (options.length < 2) return res.status(400).json({ error: 'Minimum 2 options required' })
      if (validated.category === 'MCQ' && correctCount !== 1) return res.status(400).json({ error: 'MCQ must have exactly one correct answer' })
      if (validated.category === 'MSQ' && correctCount < 1) return res.status(400).json({ error: 'MSQ must have at least one correct answer' })
    } else if (validated.answer === undefined || validated.answer === '') {
      return res.status(400).json({ error: 'Answer required for Text category' })
    }

    section.questionSet.push(validated)
    test.markModified('sections')
    await test.save()

    res.status(200).json({ message: 'Question added', data: test })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}


export const addProblemToSection = async (req, res) => {
  try {
    const { testId, sectionId } = req.params

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ error: 'Invalid testId or sectionId' })
    }

    const { problemId } = req.body
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ error: 'Invalid problemId' })
    }

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const section = test.sections.id(sectionId)
    if (!section) return res.status(404).json({ error: 'Section not found' })

    // Avoid duplicates
    if (section.problemset.includes(problemId)) {
      return res.status(400).json({ error: 'Problem already exists in section' })
    }

    section.problemset.push(problemId)
    test.markModified('sections')
    await test.save()

    return res.status(200).json({ message: 'Problem added to section', data: section.problemset })
  } catch (error) {
    console.error(error)
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}


export const addBulkQuestionsToSection = async (req, res) => {
  try {
    const { testId, sectionId } = req.params

    if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ error: 'Invalid test or section ID' })
    }

    const validatedQuestions = bulkQuestionSchema.parse(req.body)

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const section = test.sections.id(sectionId)
    if (!section) return res.status(404).json({ error: 'Section not found' })
    if(section.sectionType == "Coding"){
      return res.status(400).json({ error: 'Cannot add questions to coding section' })
    }
    // Validate MCQ/MSQ/Text rules for each question
    for (const validated of validatedQuestions) {
      if (validated.category !== 'Text') {
        const options = validated.options || []
        const correctCount = options.filter(o => o.isCorrect).length
        if (options.length < 2) return res.status(400).json({ error: 'Each non-Text question must have at least 2 options' })
        if (validated.category === 'MCQ' && correctCount !== 1)
          return res.status(400).json({ error: 'MCQ must have exactly one correct answer' })
        if (validated.category === 'MSQ' && correctCount < 1)
          return res.status(400).json({ error: 'MSQ must have at least one correct answer' })
      } else if (validated.answer === undefined || validated.answer === '') {
        return res.status(400).json({ error: 'Answer required for Text category' })
      }
    }

    // Push all validated questions
    section.questionSet.push(...validatedQuestions)
    test.markModified('sections')
    await test.save()

    res.status(200).json({ message: 'Bulk questions added successfully', data: section.questionSet })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}
// -------------------------
// Update Question
// -------------------------
export const updateQuestionInSection = async (req, res) => {
  try {
    const { testId, sectionIndex, questionIndex } = req.params
    const validated = questionSchema.parse(req.body)

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const section = test.sections[sectionIndex]
    if (!section) return res.status(404).json({ error: 'Section not found' })

    if (!section.questionSet[questionIndex]) {
      return res.status(404).json({ error: 'Question not found' })
    }

    section.questionSet[questionIndex] = validated
    test.markModified('sections')
    await test.save()

    res.status(200).json({ message: 'Question updated', data: test })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors })
    res.status(500).json({ error: error.message })
  }
}

// -------------------------
// Delete Question
// -------------------------
export const deleteQuestionFromSection = async (req, res) => {
  try {
    const { testId, sectionIndex, questionIndex } = req.params

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const section = test.sections[sectionIndex]
    if (!section) return res.status(404).json({ error: 'Section not found' })

    if (!section.questionSet[questionIndex]) {
      return res.status(404).json({ error: 'Question not found' })
    }

    section.questionSet.splice(questionIndex, 1)
    test.markModified('sections')
    await test.save()

    res.status(200).json({ message: 'Question deleted', data: test })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


export const deleteSectionFromTest = async (req,res) => {
  
}