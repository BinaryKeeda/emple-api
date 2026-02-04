import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { createServer } from 'http';
import { corsConfig} from '../config/config.js';
import { resolver } from './graphql/resolvers/resolvers.js';
import { schema } from './graphql/schemas/schema.js';
import '../config/passport.js'; // Passport config (strategy setup)
import '../config/redisConn.js'
// Routes
import authRouter from './services/core/routes/auth.js';
import profileRouter from './services/user/routes/profileRoutes.js';
import quizRouter from './services/quiz/routes/quizRoutes.js';
import morgan from 'morgan'
import codeRouter from './services/core/routes/codeReview.js';
import codeEvalRouter from './services/core/routes/codeExecute.js';
import testRouter from './services/core/routes/testRoutes.js';
import campusSuperAdminRouter from './services/campus/routes/superAdmin.js';
import { getIO, initializeSocket, registerSocketEvents } from '../config/socket.js';
import campusAuthRouter from './services/campus/routes/auth.js';
import campusTestRouter from './services/campus/routes/testRouter.js';
import adminRouter from './services/admin/adminRouter.js';
import userDataRouter from './services/user/routes/userRoutes.js';
import {createProxyMiddleware} from 'http-proxy-middleware'
import { isAdmin, isUser } from './middlewares/isAuthenticated.js';
import helmet from 'helmet';
import uploadRouter from './services/uploader/uploadRouter.js';
import examRouter from './services/exam/routes/examRoutes.js';
import Users from '../models/core/User.js';
import descopeRouter from './services/auth/descopeRouter.js';



configDotenv();

// Connect to MongoDB
mongoose.connect(process.env.URI, {
})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:"));

// Express App
const app = express();
const PORT = process.env.API_PORT || 5001;

/* =======================
   Middleware Configuration
========================== */

// 0. Socket Io - Set up 
const httpServer = createServer(app);
const io =  initializeSocket(httpServer);
// 1. CORS - apply before any routes
app.use(cors(corsConfig));
app.use(morgan('dev'));
// Disable caching for all responses
// app.use((req, res, next) => {
//   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//   res.setHeader('Pragma', 'no-cache');
//   res.setHeader('Expires', '0');
//   res.setHeader('Surrogate-Control', 'no-store');
//   next();
// });


// 2. Body Parsers
app.use(express.json()); // for JSON body
app.use(express.urlencoded({ extended: true })); // for form data 

// =========================Morgan Loggin ===================
morgan.token('date', () => new Date().toISOString());

// Custom token for user ID
morgan.token('user-id', (req) => ((req.user && req.user.email ) || req.body.email) || 'guest');

// Use custom format
app.use(morgan(':date :method :url :status :res[content-length] - :response-time ms - user=:user-id'));

// =========================Morgan Loggin ===================


// 3. Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.URI }),
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));


// 4. Passport init
app.use(passport.initialize());
app.use(passport.session());

/* =======================
   Apollo GraphQL Setup
========================== */

const server = new ApolloServer({
  typeDefs: schema,
  resolvers: resolver,
  // plugins: [ApolloServerPluginLandingPageDisabled()]
});
await server.start();
app.use(helmet())
app.use('/graphql', expressMiddleware(server));

/* =======================
   Routes
========================== */
// DESCOPE ROUTES
app.use('/api/v2/auth' , descopeRouter);
// Public Auth Routes
app.use('/auth', authRouter);
app.use('/auth/campus', campusAuthRouter);

/*========================
  Data fecthing routes
  =========================*/
app.use('/api/data', userDataRouter);
// Auth Middlewarex
app.use('/api/upload',uploadRouter);
// app.use(isUser);
/* =======================
   Core Routes
========================== */
app.use('/api', profileRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/code/', codeRouter);
app.use('/api/judge0/',codeEvalRouter);
app.use('/api/test' , testRouter);

/* =======================
   Campus Api Starts
========================== */
app.use('/api/campus', campusSuperAdminRouter);

app.use('/api/test/campus', campusTestRouter);
/* =======================
   Campus Api Ends
========================== */

/* =======================
   Admin Api Starts
========================== */
app.use('/api/admin' ,isAdmin, adminRouter);

/* =======================
   Admin Api Ends
========================== */
// -----------------------

app.use('/api/exam', examRouter);
/* =======================
   Health Check
========================== */
app.get('/', (req, res) => {
  res.send('Oops , you landed on the wrong page <a href="https://binarykeeda.com" > Go here</a>');
});




/* =======================
Start Server
========================== */
registerSocketEvents(getIO())


httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


// // proxy middleware
// app.use('/resume' , createProxyMiddleware({
//    //  target: 'http://localhost:5005',
//     target: 'http://atsnode:5005',
//     changeOrigin: true,
// }));


