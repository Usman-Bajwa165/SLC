-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "senderName" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "obtainedMarks" DOUBLE PRECISION,
ADD COLUMN     "totalMarks" DOUBLE PRECISION;
