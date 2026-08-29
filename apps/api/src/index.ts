import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
