-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "other_transactions" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" INTEGER,
    "notes" TEXT,
    "senderName" TEXT,
    "receiverName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "other_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "other_transactions" ADD CONSTRAINT "other_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
