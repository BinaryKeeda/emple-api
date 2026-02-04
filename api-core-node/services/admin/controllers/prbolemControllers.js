import Problem from "../../../../models/test/Problem.js"
import problemSchema from "../validator/problemValidator.js"

// POST /api/problems
export const addProblem = async (req, res) => {
  const parsed = problemSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    })
  }

  try {
    const newProblem = new Problem(parsed.data)
    await newProblem.save()
    res.status(201).json({ success: true, data: newProblem })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
