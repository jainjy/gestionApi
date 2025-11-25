const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main(){
    console.log("✓ commencement du seed des categories");
    const categories = await prisma.category.createMany({
      data: [
        { name: "Prestations intérieures" },
        { name: "Prestations extérieures" },
        { name: "Constructions" },
        { name: "Pilates" },
        { name: "Yoga" },
        { name: "Cuisine" },
        { name: "Sport" },
        { name: "Motivation" },
        { name: "Guérison" },
        { name: "Spriritualité" },
        { name: "Méditation" },
      ],
    });
    console.log("✓ Catégories créées");
}
main()