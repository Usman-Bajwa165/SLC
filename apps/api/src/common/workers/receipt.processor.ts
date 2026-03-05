import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

@Processor('receipts')
export class ReceiptProcessor {
  private readonly logger = new Logger(ReceiptProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  @Process('generate-receipt')
  async generateReceipt(job: Job<{ paymentId: number }>) {
    const { paymentId } = job.data;
    this.logger.log(`Generating receipt for payment #${paymentId}`);

    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: { include: { department: true } },
          method: true,
          account: true,
          allocations: { include: { payment: false } },
        },
      });

      if (!payment) {
        this.logger.warn(`Payment #${paymentId} not found for receipt generation`);
        return;
      }

      // Generate simple HTML receipt → would be rendered to PDF by Puppeteer in production
      const receiptHtml = this.buildReceiptHtml(payment);
      const receiptBuffer = Buffer.from(receiptHtml, 'utf-8');
      const objectName = `receipts/${payment.receiptNo}.html`;

      await this.storage.uploadBuffer(objectName, receiptBuffer, 'text/html');
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { receiptPath: objectName },
      });

      this.logger.log(`Receipt generated: ${objectName}`);
    } catch (error) {
      this.logger.error(`Failed to generate receipt for payment #${paymentId}:`, error.message);
      throw error; // Bull will retry
    }
  }

  private buildReceiptHtml(payment: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${payment.receiptNo}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1A3C6E; padding-bottom: 20px; margin-bottom: 20px; }
    .college-name { font-size: 24px; font-weight: bold; color: #1A3C6E; }
    .receipt-title { font-size: 14px; color: #C49A1A; letter-spacing: 2px; margin-top: 4px; }
    .receipt-no { font-size: 18px; font-weight: bold; color: #C49A1A; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    td:first-child { font-weight: bold; color: #1A3C6E; width: 40%; }
    .total-row td { font-size: 18px; font-weight: bold; background: #EAF0F8; }
    .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="college-name">STARS LAW COLLEGE</div>
    <div class="receipt-title">OFFICIAL PAYMENT RECEIPT</div>
  </div>
  <div class="receipt-no">Receipt No: ${payment.receiptNo}</div>
  <table>
    <tr><td>Student Name</td><td>${payment.student.name}</td></tr>
    <tr><td>Registration No</td><td>${payment.student.registrationNo}</td></tr>
    <tr><td>Department</td><td>${payment.student.department.name}</td></tr>
    <tr><td>Payment Date</td><td>${new Date(payment.date).toLocaleDateString()}</td></tr>
    <tr><td>Payment Method</td><td>${payment.method.name}</td></tr>
    ${payment.account ? `<tr><td>Account</td><td>${payment.account.label}</td></tr>` : ''}
    ${payment.notes ? `<tr><td>Notes</td><td>${payment.notes}</td></tr>` : ''}
    <tr class="total-row"><td>Amount Paid</td><td>PKR ${parseFloat(payment.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td></tr>
  </table>
  <div class="footer">
    Generated: ${new Date().toLocaleString()} | Stars Law College — Finance System
  </div>
</body>
</html>`;
  }
}
