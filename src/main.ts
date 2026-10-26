// src/main.ts
import express, { type Express, type Request, type Response } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { usersRouter } from './routers/users.ts';   // ← on importe le router

const app: Express = express();

//Middleware
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));

//Login → génère le JWT
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username !== 'admin' || password !== 'pass') {
    return res.status(401).send({ error: 'Identifiants invalides' });
  }
  res.json({ token: jwt.sign({ username }, 'secret-jwt', { expiresIn: '2m' }) });
});

//Toutes les routes users vivent maintenant dans routers/users.ts
app.use(usersRouter);

app.listen(3000);