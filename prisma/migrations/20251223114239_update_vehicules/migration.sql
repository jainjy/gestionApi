-- AlterTable
ALTER TABLE "ReservationVehicule" ADD COLUMN     "coordonneesPrise" JSONB,
ADD COLUMN     "coordonneesRetour" JSONB,
ADD COLUMN     "itineraire" JSONB;
