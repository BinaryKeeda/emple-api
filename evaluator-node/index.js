import express from 'express';
import cors from 'cors';
import { corsConfig } from '../config/config.js';
import mailRouter from './routes/mailRoutes.js';
import MongoStore from 'connect-mongo'
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan'
import quizRouter from './routes/quizRoutes.js';
import '../config/passport.js';
import mongoose from 'mongoose';
import testRouter from './routes/testRoutes.js';
import campusRouter from './routes/campusRoutes.js';
import examRouter from './routes/examRoutes.js';
import ExamSolution from '../models/Exam/ExamSolution.js';
const app = express();
const PORT = process.env.EVALUATOR_PORT || 3001;
import axios from 'axios';
import fs from 'fs';
mongoose.connect(process.env.URI)
.then(()=>console.log("Connected"))
.catch((e) => console.log(e));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.URI }),
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 , sameSite: 'none'},
}));

app.use(express.json());
app.use(cors(corsConfig));
app.use(morgan('dev'))


app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Oops , you landed on the wrong page <a href="https://binarykeeda.com" > Go here</a>');
});
app.use('/api/v4/mail', mailRouter);
// app.use((req,res,next) => {
//    if(req.isAuthenticated()) next();
//    else res.status(401).json({message: "Unauthorised"})
// })


app.use('/api/v4/eval/quiz', quizRouter); 
app.use('/api/v4/eval/test' ,testRouter);
app.use('/weebhooks/exam/eval',examRouter);

// webhooks
app.use('/weebhooks/campus/eval' , campusRouter);


app.listen(PORT , () => {
  console.log(`Server live at http://localhost:${PORT}`);
})

// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// const createResult = async () => {
//   try {
//     const results = await ExamSolution.find({
//       testId: "694a31dc9da1e9823ddd2c4e",
//     })

//     if (!results || results.length === 0) {
//       console.log("No document found");
//       return;
//     }

//     // Convert each document to plain object
//     const data = await Promise.all(results.map(async (doc) => {
//       const name = doc.userDetails[0]?.name;
//       const sap_id = doc.userDetails[0]?.sap_id;
//       const faculty_name = doc.userDetails[0]?.faculty;
//       const batch = doc.userDetails[0]?.batch;
//       const responseResults = await Promise.all(doc?.response.map(async (response) => {
//           if (response?.sectionType === "quiz") {
//             const total = response?.totalQuestions;
//             const correct = response?.correctAnswers;
//             const percentage = (correct / total) * 100;
//             return { total, correct, percentage };
//           } else {
//             const codingEntries = response?.codingAnswers?.[0] || {};
//             const result = await Promise.all(
//               Object.keys(codingEntries).map(async (id) => {
//                 const tokens = codingEntries[id]?.tokens?.map((t) => t.token) || [];
//                 let tokenString = false;
//                 let res;
//                 if(!tokenString){
//                   try{
//                     const payload = {
//                       code: codingEntries[id].code,
//                       language: codingEntries[id].language,
//                       problemId: id
//                     }
//                     await sleep(1000); 
//                     const res = await axios.post('http://localhost:5001/api/judge0/eval' , payload)
//                     tokenString = res.data.join(',')
//                     if(res.status == 200) console.log("ok")
//                   }
//                   catch(e){
//                     console.log(e);
//                     return { totalCount:0,passCount:0}
//                   }
//                 }
//                 try{
//                   await sleep(300); 
//                   res = await axios.get(
//                       `http://execution.api.binarykeeda.com/submissions/batch/?base64_encoded=true&tokens=${tokenString}`
//                   );
//                 }catch(e){
//                     return {id:doc._id, totalCount:0,passCount:0}
//                 }
                

//                 const submissions = res.data.submissions;
//                 const totalCount = submissions.length;
//                 const passCount = submissions.filter(
//                   (s) => s?.status?.id === 3
//                 ).length;

//                 codingEntries[id].passed = passCount;
//                 codingEntries[id].total = totalCount;

//                 return { passCount, totalCount  , tokens:tokens?.length > 0};
//               })
//             );
//             return result;
//           }
//         })
//       )
    

//       return { name, sap_id , faculty_name, batch , responseResults};
//     }))

//     // now creating result
//     // Convert to JSON string
//     const jsonData = JSON.stringify(data, null, 2);
//     // const jsonData2 = JSON.stringify(results, null, 2);

//     // Write file
//     fs.writeFileSync("result.json", jsonData);

//     console.log("JSON file created: result.json");
//   } catch (error) {
//     console.log(error);
//   }
// };

// createResult().then(() => {});
// async function pollJudge0(tokenString) {
//   while (true) {
//     const res = await axios.get(
//                 `http://execution.api.binarykeeda.com/submissions/batch/?base64_encoded=true&tokens=${tokenString}`
//               );

//     const submissions = res.data.submissions;

//     const stillRunning = submissions.some(
//       s => s.status.id === 1 || s.status.id === 2
//     );

//     if (!stillRunning) {
//       return submissions; // ✅ final results
//     }

//     await new Promise(r => setTimeout(r, 100)); // wait 1s
//   }
// }
// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// const createResult = async () => {
//   try {
//     const results = await ExamSolution.find({ testId: "694a671b9da1e9823ddd4d10" });
    
//     if (!results || results.length === 0) {
//       console.log("No document found");
//       return;
//     }

//     const data = [];
//       let count = 0;

//     // Process documents sequentially
//     for (const doc of results) {
//       const name = doc.userDetails[0]?.name;
//       const sap_id = doc.userDetails[0]?.sap_id;
//       const faculty_name = doc.userDetails[0]?.faculty;
//       const batch = doc.userDetails[0]?.batch;

//       const responseResults = [];

//       // Process responses sequentially
//       for (const response of doc?.response) {
//         if (response?.sectionType === "quiz") {
//           const total = response?.totalQuestions;
//           const correct = response?.correctAnswers;
//           const percentage = (correct / total) * 100;
//           responseResults.push({ total, correct, percentage });
//         } else {
//           const codingEntries = response?.codingAnswers?.[0] || {};
//           const result = [];

//           // Process coding entries sequentially
//           for (const id of Object.keys(codingEntries)) {
//             const tokens = codingEntries[id]?.tokens?.map((t) => t.token) || [];
//             let tokenString = false;
//             let res;

//             if (!tokenString) {
//               try {
//                 const payload = {
//                   code: codingEntries[id].code,
//                   language: codingEntries[id].language,
//                   problemId: id
//                 };
                
//                 // await sleep(100);
                
//                 res = await axios.post('http://localhost:5001/api/judge0/eval', payload);
//                 tokenString = res.data.map((t) => t.token).join(',');
                
//                 if (res.status == 200) {
//                   console.log("Judge0 evaluation ok");
//                 }
//               } catch (e) {
//                 console.log(e);
//                 result.push({ totalCount: 0, passCount: 0 });
//                 continue;
//               }
//             }

//             try {
//               // await sleep(100);
//               // console.log(JSON.stringify(tokenString))
//               // res = await axios.get(
//               //   `http://execution.api.binarykeeda.com/submissions/batch/?base64_encoded=true&tokens=${tokenString}`
//               // );
//               res = await pollJudge0(tokenString);
//             } catch (e) {
//               result.push({ id: doc._id, totalCount: 0, passCount: 0 });
//               continue;
//             }

//             const submissions = res;
//             const totalCount = submissions.length;
//             const passCount = submissions.filter((s) => s?.status?.id === 3).length;
            
//             codingEntries[id].passed = passCount;
//             codingEntries[id].total = totalCount;
            
//             result.push({ passCount, totalCount, tokens: tokens?.length > 0 });
//           }
//           responseResults.push(result);
//           console.log("Response", count++);
//         }
//       }

//       data.push({ name, sap_id, faculty_name, batch, responseResults });
//     }

//     const jsonData = JSON.stringify(data, null, 2);
//     fs.writeFileSync("result.json", jsonData);
//     console.log("JSON file created: result.json");
//   } catch (error) {
//     console.log(error);
//   }
// };

// createResult().then(() => {});