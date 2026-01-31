const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const updates = [
    {
      id: "0d812425-8a4a-4dda-a65e-c0e56eb704b1",
      latitude: -20.9606,
      longitude: 55.6506,
    },
    {
      id: "2ae50d32-7ec3-4de4-89f0-21218a953cf0",
      latitude: -20.876425,
      longitude: 55.451927,
    },
    {
      id: "3a4d22b0-6041-47e1-b945-eb4ac087e55e",
      latitude: -20.882057,
      longitude: 55.450675,
    },
    {
      id: "3adda67f-a851-403c-a78b-56fac60bdbe3",
      latitude: -20.882057,
      longitude: 55.450675,
    },
    {
      id: "3d5de8dd-24c0-4f94-98ff-22a308c5de2d",
      latitude: -20.8969,
      longitude: 55.549198,
    },
    {
      id: "919cc5f8-2b9d-4e46-ad69-37128d24b581",
      latitude: -20.882057,
      longitude: 55.450675,
    },
    {
      id: "9347adc4-d6f6-4635-95f9-e4134d7cb77b",
      latitude: -20.882057,
      longitude: 55.450675,
    },
    {
      id: "a35d1237-45eb-4254-8ac0-30188cac7f57",
      latitude: -20.882057,
      longitude: 55.450675,
    },
    {
      id: "bf88e335-ef90-4a39-898d-561d237aaff3",
      latitude: -21.1664,
      longitude: 55.2869,
    },
    {
      id: "f716640c-04e6-4eb0-9cd7-690208f011cb",
      latitude: -20.876719,
      longitude: 55.453601,
    },
    {
      id: "ebcd6f0c-a949-4a57-9051-53badfc81573",
      latitude: -20.882057,
      longitude: 55.450675,
    },
  ];

  for (const user of updates) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });

    console.log(`✅ Updated user ${user.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
