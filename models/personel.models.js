const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");

// Fonction pour générer un mot de passe aléatoire
function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// GET ALL - Récupérer tous les personnels
async function getAllPersonel(req, res) {
  try {
    const { excludeSupport } = req.query;
    
    const whereClause = {};
    if (excludeSupport === 'true') {
      whereClause.rolePersonel = { not: 'support' };
    }

    const personels = await prisma.personel.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            userType: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const personelsFormatted = personels.map(personel => ({
      id: personel.id,
      name: personel.name,
      email: personel.email, // NOUVEAU
      role: personel.rolePersonel,
      description: personel.description,
      createdAt: personel.createdAt,
      updatedAt: personel.updatedAt,
      user: personel.user,
      userId: personel.idUser
    }));
    
    res.status(200).json({
      success: true,
      count: personelsFormatted.length,
      data: personelsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur getAllPersonel:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

// GET ONE - Récupérer un personnel
async function getOnePersonel(req, res) {
  try {
    const { id } = req.params;
    
    const personel = await prisma.personel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            userType: true,
            companyName: true,
            commercialName: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    });

    if (!personel) {
      return res.status(404).json({ 
        success: false,
        error: "Personnel non trouvé" 
      });
    }

    const personelFormatted = {
      id: personel.id,
      name: personel.name,
      email: personel.email, // NOUVEAU
      role: personel.rolePersonel,
      description: personel.description,
      createdAt: personel.createdAt,
      updatedAt: personel.updatedAt,
      user: personel.user,
      userId: personel.idUser
    };

    res.status(200).json({
      success: true,
      data: personelFormatted
    });
  } catch (error) {
    console.error('❌ Erreur getOnePersonel:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
}

// GET BY USER - Récupérer les personnels d'un utilisateur
async function getPersonelByUser(req, res) {
  try {
    const { userId } = req.params;
    
    const personels = await prisma.personel.findMany({
      where: { idUser: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const personelsFormatted = personels.map(personel => ({
      id: personel.id,
      name: personel.name,
      email: personel.email, // NOUVEAU
      role: personel.rolePersonel,
      description: personel.description,
      createdAt: personel.createdAt,
      updatedAt: personel.updatedAt,
      user: personel.user,
      userId: personel.idUser
    }));

    res.status(200).json({
      success: true,
      count: personelsFormatted.length,
      data: personelsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur getPersonelByUser:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
}

// CREATE - Créer un personnel (commercial ou pro uniquement)
// CREATE - Créer un personnel (commercial ou pro uniquement)
async function setPersonel(req, res) {
  try {
    console.log("=".repeat(50));
    console.log("🚀 DÉBUT setPersonel");
    console.log("📦 Corps complet de la requête:", JSON.stringify(req.body, null, 2));
    console.log("📦 Headers:", req.headers);
    
    const {
      name,
      email,
      role,
      description,
      password,
      idUser
    } = req.body;

    console.log("📝 Données extraites:", { 
      name, 
      email, 
      role, 
      description, 
      idUser, 
      password: password ? '***' : 'NON FOURNI' 
    });

    // Validation des données
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!role) missingFields.push('role');
    if (!idUser) missingFields.push('idUser');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      console.log("❌ Champs manquants:", missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Champs requis manquants: ${missingFields.join(', ')}`,
        received: req.body
      });
    }

    // Vérifier que le rôle n'est pas 'support' (interdit en création manuelle)
    if (role === 'support') {
      console.log("❌ Tentative de création support manuelle");
      return res.status(400).json({
        success: false,
        message: "Les comptes support sont créés automatiquement par le système"
      });
    }

    console.log("🔍 Vérification email existant:", email);
    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.personel.findUnique({
      where: { email }
    });

    if (existingEmail) {
      console.log("❌ Email déjà utilisé:", email);
      return res.status(400).json({
        success: false,
        message: "Un compte avec cet email existe déjà"
      });
    }

    console.log("🔍 Vérification utilisateur existant:", idUser);
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: idUser }
    });

    if (!existingUser) {
      console.log("❌ Utilisateur non trouvé:", idUser);
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    console.log("✅ Utilisateur trouvé:", existingUser.email);

    // Vérifier les rôles autorisés
    const allowedRoles = ['commercial', 'pro'];
    if (!allowedRoles.includes(role)) {
      console.log("❌ Rôle non autorisé:", role);
      return res.status(400).json({ 
        success: false,
        message: "Le rôle doit être 'commercial' ou 'pro'" 
      });
    }

    console.log("🔐 Hashage du mot de passe...");
    // Hasher le mot de passe
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Mot de passe hashé");

    console.log("💾 Création du personnel dans la base de données...");
    // Créer le personnel
    const personel = await prisma.personel.create({
      data: {
        name,
        email,
        rolePersonel: role,
        description: description || null,
        password: hashedPassword,
        idUser
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    console.log("✅ Personnel créé avec succès:", personel.id);

    // Transformer la réponse
    const personelFormatted = {
      id: personel.id,
      name: personel.name,
      email: personel.email,
      role: personel.rolePersonel,
      description: personel.description,
      createdAt: personel.createdAt,
      updatedAt: personel.updatedAt,
      user: personel.user,
      userId: personel.idUser
    };

    console.log("📤 Envoi de la réponse au frontend...");
    res.status(201).json({
      success: true,
      message: "Personnel créé avec succès",
      data: personelFormatted
    });
    console.log("✅ Réponse envoyée");
    console.log("=".repeat(50));
    
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ ERREUR dans setPersonel:");
    console.error("📝 Message:", error.message);
    console.error("📚 Stack:", error.stack);
    console.error("🔍 Code:", error.code);
    console.error("📦 Meta:", error.meta);
    
    // Gérer l'erreur d'unicité de l'email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }
    
    // Envoyer l'erreur au client
    if (!res.headersSent) {
      console.log("📤 Envoi de l'erreur au client");
      return res.status(500).json({ 
        success: false,
        error: error.message,
        code: error.code
      });
    }
    console.error("⚠️ Headers déjà envoyés, impossible d'envoyer l'erreur");
    console.error("=".repeat(50));
  }
}

// UPDATE - Modifier un personnel
async function updatePersonel(req, res) {
  try {
    console.log("🔵 Données reçues pour modification:", req.body);
    console.log("🔵 ID à modifier:", req.params.id);
    
    const { id } = req.params;
    const {
      name,
      email, // NOUVEAU
      role,
      description,
      password,
      idUser
    } = req.body;

    // Vérifier si le personnel existe
    const existingPersonel = await prisma.personel.findUnique({
      where: { id }
    });

    if (!existingPersonel) {
      console.log("❌ Personnel non trouvé:", id);
      return res.status(404).json({ 
        success: false,
        error: "Personnel non trouvé" 
      });
    }

    console.log("✅ Personnel trouvé:", existingPersonel);

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== existingPersonel.email) {
      const emailExists = await prisma.personel.findUnique({
        where: { email }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé"
        });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      name: name || existingPersonel.name,
      email: email || existingPersonel.email, // NOUVEAU
      description: description !== undefined ? description : existingPersonel.description,
      idUser: idUser || existingPersonel.idUser
    };

    // Mise à jour du rôle si fourni
    if (role) {
      if (role === 'support') {
        return res.status(400).json({
          success: false,
          message: "Impossible de modifier un compte en support manuellement"
        });
      }
      updateData.rolePersonel = role;
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Vérifier si le nouvel utilisateur existe (si idUser est modifié)
    if (idUser && idUser !== existingPersonel.idUser) {
      const newUser = await prisma.user.findUnique({
        where: { id: idUser }
      });
      if (!newUser) {
        return res.status(404).json({ 
          success: false,
          message: "Nouvel utilisateur non trouvé" 
        });
      }
    }

    // Mettre à jour le personnel
    const personel = await prisma.personel.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            userType: true
          }
        }
      }
    });

    console.log("✅ Personnel mis à jour:", personel);
    
    const personelFormatted = {
      id: personel.id,
      name: personel.name,
      email: personel.email, // NOUVEAU
      role: personel.rolePersonel,
      description: personel.description,
      createdAt: personel.createdAt,
      updatedAt: personel.updatedAt,
      user: personel.user,
      userId: personel.idUser
    };

    res.status(200).json({
      success: true,
      message: "Personnel mis à jour avec succès",
      data: personelFormatted
    });
  } catch (error) {
    console.error("❌ Erreur updatePersonel:", error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
}

// DELETE - Supprimer un personnel
async function deletePersonel(req, res) {
  try {
    const { id } = req.params;

    // Vérifier si le personnel existe
    const personel = await prisma.personel.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!personel) {
      return res.status(404).json({ 
        success: false,
        error: "Personnel non trouvé" 
      });
    }

    // Supprimer le personnel
    await prisma.personel.delete({
      where: { id }
    });

    // Envoyer un email de notification pour les supports
    if (personel.rolePersonel === 'support') {
      const emailSubject = "🗑️ Suppression d'un compte support - Oliplus";
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E3A8A;">Suppression de compte support</h2>
          <p>Le compte support suivant a été supprimé :</p>
          <ul>
            <li><strong>Nom :</strong> ${personel.name}</li>
            <li><strong>Email :</strong> ${personel.email}</li>
            <li><strong>Rôle :</strong> ${personel.rolePersonel}</li>
            <li><strong>Utilisateur associé :</strong> ${personel.user?.email || 'Inconnu'}</li>
          </ul>
        </div>
      `;

      await sendEmail({
        to: "admin@oliplus.re",
        subject: emailSubject,
        html: emailHtml
      }).catch(err => console.error("Erreur envoi email:", err));
    }

    res.status(200).json({ 
      success: true,
      message: "Personnel supprimé avec succès",
      data: {
        deletedPersonelId: id,
        deletedPersonelName: personel.name,
        deletedPersonelEmail: personel.email
      }
    });
  } catch (error) {
    console.error('❌ Erreur deletePersonel:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
}

// LOGIN - Authentification du personnel
async function loginPersonel(req, res) {
  try {
    const { email, password } = req.body; // Changé de 'name' à 'email'

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir l'email et le mot de passe"
      });
    }

    // Chercher le personnel par son email (maintenant unique)
    const personel = await prisma.personel.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            userType: true,
            companyName: true,
            avatar: true
          }
        }
      }
    });

    if (!personel) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, personel.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    // Générer un token JWT pour le personnel
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: personel.idUser,
        personelId: personel.id,
        email: personel.email,
        role: personel.rolePersonel,
        type: 'personel'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ne pas renvoyer le mot de passe
    const { password: _, ...personelWithoutPassword } = personel;

    // Transformer pour le frontend
    const personelFormatted = {
      id: personelWithoutPassword.id,
      name: personelWithoutPassword.name,
      email: personelWithoutPassword.email,
      role: personelWithoutPassword.rolePersonel,
      description: personelWithoutPassword.description,
      createdAt: personelWithoutPassword.createdAt,
      updatedAt: personelWithoutPassword.updatedAt,
      user: personelWithoutPassword.user,
      userId: personelWithoutPassword.idUser,
      token
    };

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: personelFormatted
    });
  } catch (error) {
    console.error('❌ Erreur loginPersonel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Ajoutez cette fonction dans personel.model.js (avant le module.exports)

// Création automatique d'un compte support pour un utilisateur
async function createSupportForUser(req, res) {
  try {
    const { userId } = req.params;

    console.log("🔄 Création automatique de support pour l'utilisateur:", userId);

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si un support existe déjà
    const existingSupport = await prisma.personel.findFirst({
      where: {
        idUser: userId,
        rolePersonel: 'support'
      }
    });

    if (existingSupport) {
      return res.status(400).json({
        success: false,
        message: "Un compte support existe déjà pour cet utilisateur",
        data: {
          id: existingSupport.id,
          name: existingSupport.name,
          email: existingSupport.email
        }
      });
    }

    // Générer un email unique
    const baseEmail = `support-${user.firstName || 'user'}-${user.lastName || ''}@oliplus.support`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-@.]/g, '');
    
    let email = baseEmail;
    let counter = 1;
    
    while (await prisma.personel.findUnique({ where: { email } })) {
      email = baseEmail.replace('@', `${counter}@`);
      counter++;
    }

    // Générer un nom de support
    const supportName = `Support-${user.firstName || 'User'}-${user.lastName || ''}`.replace(/\s+/g, '-');
    
    // Générer un mot de passe
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Créer le support
    const support = await prisma.personel.create({
      data: {
        name: supportName,
        email: email,
        rolePersonel: 'support',
        description: `Support automatique pour ${user.companyName || user.email}`,
        password: hashedPassword,
        idUser: userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    // Envoyer l'email (si la fonction existe)
    if (typeof sendSupportCredentials === 'function') {
      await sendSupportCredentials(user, support, generatedPassword);
    }

    console.log("✅ Support créé automatiquement:", support.id);

    res.status(201).json({
      success: true,
      message: "Compte support créé automatiquement avec succès",
      data: {
        id: support.id,
        name: support.name,
        email: support.email,
        role: support.rolePersonel,
        userId: support.idUser
      }
    });

  } catch (error) {
    console.error('❌ Erreur createSupportForUser:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// N'oubliez pas d'ajouter generatePassword si elle n'existe pas
function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}
module.exports = {
  getAllPersonel,
  setPersonel,
  updatePersonel,
  deletePersonel,
  getOnePersonel,
  getPersonelByUser,
  loginPersonel,
  createSupportForUser
};