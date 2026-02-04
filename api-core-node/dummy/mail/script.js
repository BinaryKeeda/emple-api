import Problem from "../../../models/test/Problem.js";

const problemId = "686add12e60a24c6831aa448";
const testcases =[
  {
    "input": "3\n10 50 10",
    "output": "0"
  },
  {
    "input": "4\n10 20 30 10",
    "output": "20"
  },
  {
    "input": "5\n30 10 60 10 60",
    "output": "30"
  },
  {
    "input": "2\n100 100",
    "output": "0"
  },
  {
    "input": "6\n10 20 10 30 10 40",
    "output": "30"
  },
  {
    "input": "10\n10 30 40 50 20 10 70 80 90 100",
    "output": "130"
  },
  {
    "input": "5\n10 20 30 40 50",
    "output": "40"
  },
  {
    "input": "5\n100 90 80 70 60",
    "output": "40"
  },
  {
    "input": "7\n10 10 10 10 10 10 10",
    "output": "0"
  },
  {
    "input": "4\n4 4 4 4",
    "output": "0"
  }
]

// Attach each to the problem
export default async function seed() {
    const problem = await Problem.findById("686add12e60a24c6831aa448")
    problem.testCases = testcases;
    problem.save()
    // console.log("done")
}