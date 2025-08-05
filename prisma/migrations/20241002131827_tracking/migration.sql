-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfillmentLastUpdatedDate" TIMESTAMP(3),
ADD COLUMN     "fulfillmentStatus" TEXT,
ADD COLUMN     "fulfillmentTrackingNumber" TEXT,
ADD COLUMN     "fulfillmentTrackingUrl" TEXT,
ADD COLUMN     "trackingCompany" TEXT;
