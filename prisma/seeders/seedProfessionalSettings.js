// scripts/createProfessionalSettings.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSettingsForExistingProfessionals() {
  try {
    // Récupérer tous les utilisateurs professionnels sans paramètres
    const professionals = await prisma.user.findMany({
      where: {
        OR: [
          { role: "professional" }
        ],
        ProfessionalSettings: null,
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    console.log(
      `📊 ${professionals.length} professionnels sans paramètres trouvés`
    );

    for (const user of professionals) {
      try {
        await prisma.professionalSettings.create({
          data: {
            userId: user.id,
            nomEntreprise: user.companyName || "Entreprise",
            emailContact: user.email,
            telephone: user.phone || "",
            adresse: user.address || "",
            // Paramètres par défaut
            delaiReponseEmail: 24,
            delaiReponseTelephone: 2,
            delaiReponseUrgence: 4,
            delaiAnnulationGratuit: 48,
            fraisAnnulationPourcent: 15,
            acomptePourcentage: 30,
            montantMinimum: 100,
            horairesLundi: { ouvert: true, debut: "09:00", fin: "18:00" },
            horairesMardi: { ouvert: true, debut: "09:00", fin: "18:00" },
            horairesMercredi: { ouvert: true, debut: "09:00", fin: "18:00" },
            horairesJeudi: { ouvert: true, debut: "09:00", fin: "18:00" },
            horairesVendredi: { ouvert: true, debut: "09:00", fin: "17:00" },
            horairesSamedi: { ouvert: false, debut: "10:00", fin: "16:00" },
            horairesDimanche: { ouvert: false, debut: "", fin: "" },
            joursFermes: [
              { date: new Date().getFullYear() + "-01-01", label: "Nouvel An" },
              { date: new Date().getFullYear() + "-12-25", label: "Noël" },
            ],
          },
        });
        console.log(`✅ Paramètres créés pour ${user.email}`);
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message);
      }
    }

    console.log("🎉 Script terminé !");
  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createSettingsForExistingProfessionals();
