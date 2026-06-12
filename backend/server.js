require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRouter = require('./src/routes/health');
const authRouter = require('./src/routes/auth');
const sessionsRouter = require('./src/routes/sessions');
const chatRouter = require('./src/routes/chat');
const recipeRouter = require('./src/routes/recipes');
const usersRouter = require('./src/routes/users');
const shoppingListRouter = require('./src/routes/shoppingList');
const mealPlanRouter = require('./src/routes/mealPlan');
const supportRouter = require('./src/routes/support');
const adminRouter = require('./src/routes/admin');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/users', usersRouter);
app.use('/api/shopping-list', shoppingListRouter);
app.use('/api/meal-plan', mealPlanRouter);
app.use('/api/support', supportRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FoodBot backend running on port ${PORT}`);
  });
}

module.exports = app;
