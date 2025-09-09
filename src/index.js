/*
  - Point d'entrée du serveur Express.
  - Rôle principal : configurer les middlewares, le CORS, connecter la DB
    et monter les routes.

  Concepts clés pour débutant :
  - dotenv : charge les variables d'environnement depuis un fichier .env
  - express.json() : permet à Express de parser le corps JSON des requêtes
  - cookieParser : lit les cookies (utile pour l'authentification via cookies)
  - CORS : règle qui autorise le navigateur à appeler le backend depuis une origine différente
*/

// framework utilisé par le serveur node
import express from "express";

// permet de lire les variables d'environnement contenues dans .env
import dotenv from "dotenv";

// permet de lire le contenu des cookies
import cookieParser from "cookie-parser";

import cors from "cors";

// permet de préciser où sont les routes (index des routes)
import routes from "./routes/index.js";
import errorFormat from "./middlewares/errorFormat.js";

// récupère la connexion à la base de données
import { connectDB } from "./lib/db.js";

// indique que l'on va utiliser .env (charge process.env)
dotenv.config();

const PORT = process.env.PORT || 5000; // valeur par défaut si non définie

// crée l'app Express
const app = express();

// middlewares globaux
app.use(cookieParser()); // parse les cookies depuis la requête
app.use(express.json()); // parse le JSON dans le body des requêtes

// Configuration CORS : autorise le front à appeler le backend.
// En développement, on autorise également les origines localhost:*, ce qui
// évite les problèmes quand Vite change de port (5173 -> 5174).
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.DEPLOY_FRONT_URL,
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // autoriser les requêtes sans origine (ex: tools, server-side)
      if (!origin) return callback(null, true);
      // autoriser les origines explicitement listées
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // autoriser localhost with any port in development
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin))
        return callback(null, true);
      // otherwise reject
      return callback(new Error("CORS not allowed for origin: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// on monte les routes : toutes les routes définies dans ./routes
app.use("/", routes);

// Middleware de formatage des erreurs (doit venir après les routes)
app.use(errorFormat);

// démarre le serveur et connecte la base de données
app.listen(PORT, () => {
  console.log(`Le serveur fonctionne sur le port ${PORT}`);
  connectDB();
});
