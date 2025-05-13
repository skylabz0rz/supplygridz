import express from 'express';
import cors from 'cors';
import usersRouter from './api/users.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
