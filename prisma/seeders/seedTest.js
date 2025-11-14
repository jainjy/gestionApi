

const  fs  = require('fs');
const { prisma } = require('../../lib/db');

async function main () {
    const pros=await prisma.user.findMany({
        where: { role: 'professional' },
    });
    console.log("listes des professionnels",pros);
    fs.writeFileSync("professionals.json", JSON.stringify(pros, null, 2));
    console.log("✅ Seeding terminé avec succès !");
}
main()