import cron from "node-cron";
import { prisma } from "../lib/db.js";

cron.schedule("0 0 * * *", async () => {
  console.log("⏳ [CRON] Vérification des abonnements expirés...");

  try {
    const result = await prisma.subscription.updateMany({
      where: {
        endDate: { lt: new Date() },
        status: "active",
      },
      data: {
        status: "expired",
      },
    });

    console.log(`✔ [CRON] ${result.count} abonnements expirés mis à jour.`);
  } catch (error) {
    console.error("❌ [CRON] Erreur lors de la vérification :", error);
  }
});
