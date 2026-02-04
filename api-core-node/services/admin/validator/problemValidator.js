import {z} from 'zod'
const boilerplateSchema = z.object({
  python: z.string(),
  cpp: z.string(),
  java: z.string()
})

const functionSignatureSchema = z.object({
  python: z.string(),
  cpp: z.string(),
  java: z.string()
})

const exampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string()
})

const testCaseSchema = z.object({
  input: z.string(),
  output: z.string()
})

const problemSchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  examples: z.array(exampleSchema),
  testCases: z.array(testCaseSchema),
  boilerplate: boilerplateSchema,
  functionSignature: functionSignatureSchema,
  timeLimit: z.number().min(1).optional(),
  memoryLimit: z.number().min(1).optional(),
  languagesSupported: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
})

export default problemSchema;