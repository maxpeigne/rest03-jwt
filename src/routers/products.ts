// src/routers/users.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

//Variables (on est dans src/routers/ → ../ pour remonter dans src/)
const productsFile = path.join(import.meta.dirname, '../data/products.json');
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
        const raw = await readFile(productsFile, 'utf-8');
        const products = JSON.parse(raw);
        res.send(products)
    } catch (err) {
        res.status(500).json({error: 'Impossible de lire les donnes'});
    }
});

//Post 1 user
usersRouter.post('/adduser', requireAuth, async (req: Request, res: Response) => { 
        try {
            const products = JSON.parse(await readFile(productsFile, 'utf-8'));
            products.push(req.body);
            await writeFile(productsFile, JSON.stringify(products, null, 2));
            res.status(201).send('Product ajouté');
        } catch(err) {
            res.status(500).json({error: 'Impossible de créer user'});
        }
});

//Delete 1 user
usersRouter.delete('/deluser/:id', requireAuth, async (req: Request, res: Response) => { 
  try {
    const products = JSON.parse(await readFile(productsFile, 'utf-8'));

    const index = products.findIndex((p: { id: number; }) => p.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).send({ error: 'Product non trouvé' });
    }

    products.splice(index, 1);
    await writeFile(productsFile, JSON.stringify(products, null, 2));
    res.status(200).send('Product supprimé');
  } catch (err) {
    console.error(err);   // ← toujours logguer la vraie erreur
    res.status(500).send({ error: 'Impossible de supprimer la donnée' });
  }
});

//Update 1 user
usersRouter.put('/updateuser/:id', requireAuth, async (req: Request, res: Response) => { 
  try {
    const products = JSON.parse(await readFile(productsFile, 'utf-8'));

    // 1. Retrouver le product par son id (id ≠ index, comme pour le DELETE)
    const index = products.findIndex((p: { id: number; }) => p.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).send({ error: 'Product non trouvé' });
    }

    // 2. Remplacer l'ancien product par ce que le client envoie
    products[index] = { ...products[index], ...req.body };

    // 3. Sauvegarder
    await writeFile(productsFile, JSON.stringify(products, null, 2));
    res.status(200).send(products[index]);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Impossible de mettre à jour la donnée' });
  }
});