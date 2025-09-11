const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔗 Connexion PostgreSQL Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render te donne cette variable
  ssl: { rejectUnauthorized: false } // obligatoire sur Render
});

// ➕ Ajouter un employé
app.post("/employes", async (req, res) => {
  try {
    const { nom, poste, salaire } = req.body;
    if (!nom || !poste || !salaire) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const result = await pool.query(
      "INSERT INTO employes (nom, poste, salaire) VALUES ($1, $2, $3) RETURNING *",
      [nom, poste, salaire]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur ajout:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Lister tous les employés
app.get("/employes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employes ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔍 Récupérer un employé par ID
app.get("/employes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("SELECT * FROM employes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employé introuvable." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur récupération:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✏️ Mettre à jour un employé
app.put("/employes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nom, poste, salaire } = req.body;

    const result = await pool.query(
      "UPDATE employes SET nom = $1, poste = $2, salaire = $3 WHERE id = $4 RETURNING *",
      [nom, poste, salaire, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employé introuvable." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur mise à jour:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ❌ Supprimer un employé
app.delete("/employes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("DELETE FROM employes WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employé introuvable." });
    }

    res.json({ message: "Employé supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
