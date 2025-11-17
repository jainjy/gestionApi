import cron from "node-cron";

console.log("Cron test démarré...");

cron.schedule("* * * * * *", () => {
  console.log("Cron exécuté :", new Date().toISOString());
});
