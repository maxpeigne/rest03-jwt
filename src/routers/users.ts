// src/routers/users.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

//Variables (on est dans src/routers/ → ../ pour remonter dans src/)
const usersFile = path.join(import.meta.dirname, '../data/users.json');
const SECRET = 'secret-jwt';

//Middleware auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Token manquant' });
  }
  try {
    jwt.verify(authHeader.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).send({ error: 'Token invalide ou expiré' });
  }
}

//Le "router" = mini-app qui regroupe les routes
export const usersRouter = Router();

//Get all users
usersRouter.get('/users', async (req: Request, res: Response) => { 
    try {
        const raw = await readFile(usersFile, 'utf-8');
        const users = JSON.parse(raw);
        res.send(users)
    } catch (err) {
        res.status(500).json({error: 'Impossible de lire les donnes'});
    }
});

//Post 1 user
usersRouter.post('/adduser', requireAuth, async (req: Request, res: Response) => { 
        try {
            const users = JSON.parse(await readFile(usersFile, 'utf-8'));
            users.push(req.body);
            await writeFile(usersFile, JSON.stringify(users, null, 2));
            res.status(201).send('User ajouté');
        } catch(err) {
            res.status(500).json({error: 'Impossible de créer user'});
        }
});

//Delete 1 user
usersRouter.delete('/deluser/:id', requireAuth, async (req: Request, res: Response) => { 
  try {
    const users = JSON.parse(await readFile(usersFile, 'utf-8'));

    const index = users.findIndex(u => u.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).send({ error: 'User non trouvé' });
    }

    users.splice(index, 1);
    await writeFile(usersFile, JSON.stringify(users, null, 2));
    res.status(200).send('User supprimé');
  } catch (err) {
    console.error(err);   // ← toujours logguer la vraie erreur
    res.status(500).send({ error: 'Impossible de supprimer la donnée' });
  }
});

//Update 1 user
usersRouter.put('/updateuser/:id', requireAuth, async (req: Request, res: Response) => { 
  try {
    const users = JSON.parse(await readFile(usersFile, 'utf-8'));

    // 1. Retrouver le user par son id (id ≠ index, comme pour le DELETE)
    const index = users.findIndex(u => u.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).send({ error: 'User non trouvé' });
    }

    // 2. Remplacer l'ancien user par ce que le client envoie
    users[index] = { ...users[index], ...req.body };

    // 3. Sauvegarder
    await writeFile(usersFile, JSON.stringify(users, null, 2));
    res.status(200).send(users[index]);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Impossible de mettre à jour la donnée' });
  }
});