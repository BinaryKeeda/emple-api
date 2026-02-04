import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'
import { z } from 'zod'
import CampusTest from '../../../../models/campus/CampusTest.js'

// ----------------------- ZOD VALIDATORS ------------------------
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

export const sectionSchema = z.object({
  title: z.string().min(1),
  questionPool: z.string().optional(),
  problemPool: z.array(z.string()).optional(),
  maxQuestion: z.number().min(1),
  maxTime: z.number().min(1),
  // maxScore: z.number().optional(),
  description: z.string().optional(),
  type: z.enum(['quiz', 'coding', 'mixed']).optional()
})

export const createCampusTestSchema = z.object({
  name: z.string().min(1),
  visibility: z.enum(['private', 'public', 'group']).optional(),
  isAvailable: z.boolean().optional()
})

export const updateCampusTestSchema = createCampusTestSchema.partial()
export const addProblemsSchema = z.object({ problemIds: z.array(z.string().min(1)).min(1) })
export const addQuestionBankSchema = z.object({ questionBankId: z.string().min(1) })


// ----------------------- CONTROLLERS ------------------------

export const createCampusTest = async (req, res) => {
  try {
    const validated = createCampusTestSchema.parse(req.body)
    const newTest = new CampusTest({
      ...validated,
      groupId:req.body.groupId,
      visibility: validated.visibility || 'private',
      isAvailable: validated.isAvailable ?? false
    })

    await newTest.save()
    res.status(201).json({ message: 'Test created successfully', test: newTest })
  } catch (error) {
    console.error(error)
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors })
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const editCampusTest = async (req, res) => {
  try {
    const validated = updateCampusTestSchema.parse(req.body)
    const { id } = req.params

    const test = await CampusTest.findById(id).populate('groupId')
    if (!test) return res.status(404).json({ message: 'Test not found' })

    Object.assign(test, validated)

    // If the test is set to available, make other tests in the same group unavailable
    if (validated.isAvailable === true) {
      // Assuming `group` is a field on test to identify its group
      await CampusTest.updateMany(
        { _id: { $ne: id }, group: test.group }, // all other tests in the same group
        { $set: { isAvailable: false } }
      )
    }

    await test.save()

    res.status(200).json({ message: 'Test updated successfully', data: test })
  } catch (error) {
    console.error('Error updating test:', error)
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors })
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}


export const getCampusTestById = async (req, res) => {
  try {
    const { id } = req.params
    const test = await CampusTest.findById(id).populate('groupId').populate('sections.questionPool' , "name").populate('sections.problemPool' , 'title')
    if (!test) return res.status(404).json({ message: 'Test not found' })

    res.status(200).json({ data: test })
  } catch (error) {
    console.error('Error fetching test by ID:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
export const addProblemToCampusSection = async (req, res) => {
  try {
    const { testId, sectionId } = req.params;
    const { problemIds } = addProblemsSchema.parse(req.body);

    const test = await CampusTest.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const section = test.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Merge existing and new problemIds, keeping only unique
    const mergedProblems = [
      ...new Set([...section.problemPool.map(id => id.toString()), ...problemIds.map(id => id.toString())])
    ];

    section.problemPool = mergedProblems;
    test.markModified('sections');
    await test.save();

    res.status(200).json({ message: 'Unique problems added to section', section });
  } catch (err) {
    console.error('Error adding problems:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const addQuestionBankToCampusSection = async (req, res) => {
  try {
    const { testId, sectionId } = req.params
    const { questionBankId } = addQuestionBankSchema.parse(req.body)

    const test = await CampusTest.findById(testId)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    const section = test.sections.id(sectionId)
    if (!section) return res.status(404).json({ message: 'Section not found' })

    section.questionPool = questionBankId
    await test.markModified('sections')
    await test.save()

    res.status(200).json({ message: 'Question bank assigned to section', section })
  } catch (err) {
    console.error('Error assigning question bank:', err)
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: err.errors })
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const addSectionToCampusTest = async (req, res) => {
  try {
    const { id } = req.params
    const section = sectionSchema.parse(req.body)

    const test = await CampusTest.findById(id)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    test.sections.push(section)
    await test.save()

    res.status(200).json({ message: 'Section added', section: test.sections[test.sections.length - 1] })
  } catch (err) {
    console.error('Error adding section:', err)
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: err.errors })
    res.status(500).json({ message: 'Internal server error' })
  }
}


export const deleteSectionFromCampusTest = async (req, res) => {
  try {
    const { testId, sectionId } = req.params;

    const test = await CampusTest.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const sectionExists = test.sections.some(
      section => section._id.toString() === sectionId
    )
    if (!sectionExists)
      return res.status(404).json({ message: 'Section not found' })

    // Filter out the section
    test.sections = test.sections.filter(
      section => section._id.toString() !== sectionId
    );

    await test.save();

    res.status(200).json({ message: 'Section deleted successfully', data: test });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/campus-test/:testId/section/:sectionId/remove-problem
export const removeProblemFromSection = async (req, res) => {
  const { testId, sectionId } = req.params;
  const { problemId } = req.body;

  try {
    const test = await CampusTest.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const section = test.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    if (section.type === 'quiz') return res.status(400).json({ message: 'Section is quiz type; no problem pool' });

    section.problemPool = section.problemPool.filter(id => id.toString() !== problemId);
    await test.save();

    res.json({ message: 'Problem removed from section', section });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
