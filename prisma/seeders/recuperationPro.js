const  fs  = require("fs");
const {prisma}=require("../../lib/db")
async function main(){
    const pro=await prisma.user.findMany({
        where:{role:"professional"},
        select:{id:true,email:true,passwordHash:true}
    })
    fs.writeFileSync(
      "professionalWithPassword.json",
      JSON.stringify(pro, null, 2)
    );


}
main()
  .catch((e) => {
    console.error("Erreur:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Déconnexion de Prisma");
  });