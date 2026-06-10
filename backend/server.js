require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRouter = require('./src/routes/health');
const authRouter = require('./src/routes/auth');
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

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FoodBot backend running on port ${PORT}`);
  });
}

module.exports = app;
