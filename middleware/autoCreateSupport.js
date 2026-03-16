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

// Fonction pour générer un email unique pour le support
async function generateSupportEmail(user) {
  const baseEmail = `support-${user.firstName || 'user'}-${user.lastName || ''}@oliplus.support`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-@.]/g, '');
  
  let email = baseEmail;
  let counter = 1;
  
  // Vérifier si l'email existe déjà
  while (await prisma.personel.findUnique({ where: { email } })) {
    email = baseEmail.replace('@', `${counter}@`);
    counter++;
  }
  
  return email;
}

// Fonction pour envoyer les identifiants support par email
async function sendSupportCredentials(user, support, password) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1E3A8A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #1E3A8A; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .password { font-family: monospace; font-size: 18px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; border: 1px dashed #1E3A8A; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 [AUTO] Nouveau compte Support Oliplus</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          
          <p>Un compte <strong>support</strong> a été automatiquement créé pour :</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0; color: #1E3A8A;">Informations utilisateur</h3>
            <p><strong>Nom :</strong> ${user.firstName || ''} ${user.lastName || ''}</p>
            <p><strong>Email :</strong> ${user.email}</p>
            <p><strong>Société :</strong> ${user.companyName || 'Non renseignée'}</p>
            <p><strong>Type :</strong> ${user.userType || 'Non spécifié'}</p>
          </div>

          <div class="credentials">
            <h3 style="margin-top: 0; color: #1E3A8A;">Membre du personnel (Support)</h3>
            <p><strong>Nom :</strong> ${support.name}</p>
            <p><strong>Email :</strong> ${support.email}</p>
            <p><strong>Description :</strong> ${support.description || 'Support technique'}</p>
          </div>

          <div class="credentials">
            <h3 style="margin-top: 0; color: #1E3A8A;">🔑 Identifiants de connexion</h3>
            <p><strong>Nom d'utilisateur :</strong> ${support.name}</p>
            <p><strong>Email :</strong> ${support.email}</p>
            <p><strong>Mot de passe :</strong></p>
            <div class="password">${password}</div>
          </div>

          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul style="margin: 5px 0 0 20px;">
              <li>Ce mot de passe est à usage unique et confidentiel</li>
              <li>Changez-le dès la première connexion</li>
              <li>Ne le partagez avec personne</li>
            </ul>
          </div>

          <p>Ce compte support a été créé automatiquement par le système.</p>
          <p>URL de connexion : ${process.env.FRONTEND_URL || 'https://app.oliplus.re'}/login</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système de création automatique de comptes support.</p>
          <p>© ${new Date().getFullYear()} Oliplus. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: 'admin@oliplus.re',
      subject: `🔐 [AUTO] Nouveau compte Support - ${user.companyName || user.firstName || 'Nouvel utilisateur'}`,
      html: emailContent
    });
    console.log(`✅ Email support envoyé pour ${user.email}`);
  } catch (error) {
    console.error('❌ Erreur envoi email support:', error);
  }
}

// Fonction principale pour créer un support si nécessaire
async function ensureSupportForUser(userId) {
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log(`❌ Utilisateur ${userId} non trouvé`);
      return null;
    }

    // Vérifier si un support existe déjà
    const existingSupport = await prisma.personel.findFirst({
      where: {
        idUser: userId,
        rolePersonel: 'support'
      }
    });

    if (existingSupport) {
      console.log(`✅ Support déjà existant pour ${user.email}`);
      return existingSupport;
    }

    console.log(`🔄 Création automatique de support pour ${user.email}`);

    // Générer un nom de support
    const supportName = `Support-${user.firstName || 'User'}-${user.lastName || ''}`.replace(/\s+/g, '-');
    
    // Générer un email unique pour le support
    const supportEmail = await generateSupportEmail(user);
    
    // Générer un mot de passe
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Créer le support avec le champ email
    const support = await prisma.personel.create({
      data: {
        name: supportName,
        email: supportEmail, // NOUVEAU champ email
        rolePersonel: 'support',
        description: `Support automatique pour ${user.companyName || user.email}`,
        password: hashedPassword,
        idUser: userId
      }
    });

    console.log(`✅ Support créé avec succès pour ${user.email} (${supportEmail})`);

    // Envoyer l'email
    await sendSupportCredentials(user, support, generatedPassword);

    return support;
  } catch (error) {
    console.error('❌ Erreur ensureSupportForUser:', error);
    return null;
  }
}

// Middleware Express pour vérifier/créer le support à chaque requête authentifiée
async function autoCreateSupportMiddleware(req, res, next) {
  // Ne pas bloquer le flux, on fait en arrière-plan
  if (req.user && req.user.userId) {
    // Exécuter en arrière-plan sans attendre
    ensureSupportForUser(req.user.userId).catch(err => {
      console.error('Erreur autoCreateSupport (background):', err);
    });
  }
  next();
}

// Fonction pour vérifier tous les utilisateurs pro
async function checkAllProUsers() {
  try {
    console.log('🔄 Vérification de tous les utilisateurs pro...');
    
    // Récupérer tous les utilisateurs avec userType = 'pro' ou 'AGENCE' ou role = 'professional'
    const proUsers = await prisma.user.findMany({
      where: {
        OR: [
          { userType: { in: ['pro', 'AGENCE', 'PROFESSIONAL'] } },
          { role: 'professional' }
        ]
      }
    });

    console.log(`📊 ${proUsers.length} utilisateurs pro trouvés`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const user of proUsers) {
      try {
        const support = await ensureSupportForUser(user.id);
        if (support) {
          // Vérifier si c'est une nouvelle création
          const isNew = await prisma.personel.findFirst({
            where: {
              idUser: user.id,
              rolePersonel: 'support',
              createdAt: {
                gte: new Date(Date.now() - 5000) // Créé il y a moins de 5 secondes
              }
            }
          });
          
          if (isNew) {
            created++;
            console.log(`✅ Support créé pour ${user.email}`);
          } else {
            existing++;
          }
        }
      } catch (err) {
        errors++;
        console.error(`❌ Erreur pour ${user.email}:`, err.message);
      }
    }

    console.log(`📊 RÉSULTAT: ${created} créés, ${existing} existants, ${errors} erreurs`);
  } catch (error) {
    console.error('❌ Erreur checkAllProUsers:', error);
  }
}

module.exports = {
  ensureSupportForUser,
  autoCreateSupportMiddleware,
  checkAllProUsers
};