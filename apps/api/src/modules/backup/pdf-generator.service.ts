import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as fs from "fs";

const PDFDocument = require("pdfkit");

// ── Color Palette ──────────────────────────────────────────────────────────────
const C = {
  blue: "#1e3a8a",
  blueMid: "#3b82f6",
  blueLight: "#dbeafe",
  gray: "#64748b",
  grayLight: "#f8fafc",
  grayBorder: "#e2e8f0",
  green: "#166534",
  greenBg: "#dcfce7",
  red: "#991b1b",
  redBg: "#fee2e2",
  black: "#0f172a",
  white: "#ffffff",
};

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generate(outputPath: string): Promise<string> {
    this.logger.log(`Generating comprehensive PDF at ${outputPath}`);

    // ── Fetch ALL data ─────────────────────────────────────────────────────────
    const [
      students,
      staff,
      payments,
      staffPayments,
      otherFinance,
      accounts,
      studentFinances,
      staffFinances,
    ] = await Promise.all([
      this.prisma.student.findMany({
        where: { isDeleted: false },
        include: {
          department: true,
          session: true,
          financeRecords: true,
          payments: { include: { method: true, account: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.staff.findMany({
        where: { isDeleted: false },
        include: {
          financeRecords: { orderBy: { month: "asc" } },
          payments: { include: { method: true }, orderBy: { date: "desc" } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.payment.findMany({
        orderBy: { date: "desc" },
        include: { student: true, method: true, account: true },
      }),
      this.prisma.staffPayment.findMany({
        orderBy: { date: "desc" },
        include: { staff: true, method: true, account: true },
      }),
      this.prisma.otherTransaction.findMany({
        orderBy: { date: "desc" },
        include: { account: true },
      }),
      this.prisma.account.findMany({
        include: {
          paymentMethod: true,
          payments: { include: { student: true }, orderBy: { date: "desc" } },
          otherTransactions: { orderBy: { date: "desc" } },
          staffPayments: {
            include: { staff: true },
            orderBy: { date: "desc" },
          },
        },
        orderBy: { label: "asc" },
      }),
      this.prisma.studentFinance.findMany({ orderBy: { createdAt: "asc" } }),
      this.prisma.staffFinance.findMany({ orderBy: { month: "asc" } }),
    ]);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 30,
          bufferPages: true,
        });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        const W = doc.page.width - 60;
        const generated = new Date().toLocaleString("en-PK", { hour12: true });

        // ── COVER PAGE ─────────────────────────────────────────────────────────
        doc
          .fontSize(30)
          .fillColor(C.blue)
          .font("Helvetica-Bold")
          .text("STARS LAW COLLEGE", 30, 60, { align: "center", width: W });
        doc
          .fontSize(13)
          .fillColor(C.gray)
          .font("Helvetica")
          .text("COMPLETE SYSTEM DATABASE REPORT", {
            align: "center",
            width: W,
          });
        doc.moveDown(0.5);
        doc
          .fontSize(9)
          .fillColor(C.gray)
          .text(
            `Generated: ${generated}  |  Total Students: ${students.length}  |  Total Staff: ${staff.length}`,
            { align: "center", width: W },
          );

        doc.moveDown(2);
        // Table of contents
        const toc = [
          "1. Student Directory & Financial Summary",
          "2. Student Ledgers (Per-Term Fee Details)",
          "3. Student Payment Transaction Logs",
          "4. Staff Directory & Salary Summary",
          "5. Staff Ledgers (Per-Month Finance Details)",
          "6. Staff Payment Logs",
          "7. Other Income & Expense Transactions",
          "8. Bank & Account Ledgers",
        ];
        doc
          .fontSize(11)
          .fillColor(C.blue)
          .font("Helvetica-Bold")
          .text("TABLE OF CONTENTS", { align: "center", width: W });
        doc.moveDown(0.5);
        toc.forEach((item) => {
          doc
            .fontSize(9)
            .fillColor(C.black)
            .font("Helvetica")
            .text(item, { align: "center", width: W });
        });
        this.drawHR(doc, C.blue, W);

        // ── § 1 · STUDENTS DIRECTORY ──────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          "§ 1  STUDENT DIRECTORY & FINANCIAL SUMMARY",
          W,
          generated,
        );
        this.drawTable(
          doc,
          W,
          30,
          [
            "Reg #",
            "Name",
            "CNIC",
            "Department",
            "Session",
            "Status",
            "Fee Due",
            "Paid",
            "Remaining",
          ],
          students.map((s) => {
            const totalDue = s.financeRecords.reduce(
              (a, f) => a + Number(f.feeDue),
              0,
            );
            const totalPaid = s.financeRecords.reduce(
              (a, f) => a + Number(f.feePaid),
              0,
            );
            const totalRem = s.financeRecords.reduce(
              (a, f) => a + Number(f.remaining),
              0,
            );
            return [
              s.registrationNo || "",
              s.name,
              this.formatCnic(s.cnic),
              s.department?.name || "",
              s.session?.label || "",
              s.status.toUpperCase(),
              this.fmt(totalDue),
              this.fmt(totalPaid),
              this.fmt(totalRem),
            ];
          }),
          [70, 110, 100, 110, 70, 55, 70, 70, 75],
        );

        // ── § 2 · STUDENT LEDGERS ─────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          "§ 2  STUDENT LEDGERS (Per-Term Breakdown)",
          W,
          generated,
        );
        students.forEach((s) => {
          if (s.financeRecords.length === 0) return;
          if (doc.y > doc.page.height - 130) doc.addPage();
          doc
            .fontSize(9)
            .fillColor(C.blue)
            .font("Helvetica-Bold")
            .text(
              `${s.name}  (${s.registrationNo || "N/A"})  —  ${s.department?.name || ""}`,
              30,
              doc.y,
            );
          doc.moveDown(0.2);
          this.drawTable(
            doc,
            W,
            30,
            [
              "Term",
              "Type",
              "Fee Due",
              "Paid",
              "Advance",
              "Carry-Over",
              "Remaining",
            ],
            s.financeRecords.map((f) => [
              f.termLabel,
              f.termType,
              this.fmt(f.feeDue),
              this.fmt(f.feePaid),
              this.fmt(f.advanceTaken),
              this.fmt(f.carryOver),
              this.fmt(f.remaining),
            ]),
            [110, 65, 80, 80, 75, 80, 80],
          );
          doc.moveDown(0.5);
        });

        // ── § 3 · STUDENT PAYMENTS ────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          `§ 3  STUDENT PAYMENT TRANSACTIONS (${payments.length} records)`,
          W,
          generated,
        );
        this.drawTable(
          doc,
          W,
          30,
          [
            "Receipt #",
            "Date",
            "Student",
            "Amount (PKR)",
            "Method",
            "Account",
            "Sender / Receiver",
          ],
          payments.map((p) => [
            p.receiptNo || "",
            this.fmtDate(p.date),
            p.student?.name || "",
            this.fmt(p.amount),
            p.method?.name || "",
            p.account?.label || "Cash",
            p.senderName || p.receiverName || "—",
          ]),
          [80, 70, 130, 75, 80, 90, 110],
        );

        // ── § 4 · STAFF DIRECTORY ─────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          "§ 4  STAFF DIRECTORY & SALARY SUMMARY",
          W,
          generated,
        );
        this.drawTable(
          doc,
          W,
          30,
          [
            "Name",
            "Role",
            "CNIC",
            "Contact",
            "Joined",
            "Status",
            "Basic Salary",
            "Total Paid",
            "Total Rem.",
          ],
          staff.map((s) => {
            const paid = s.financeRecords.reduce(
              (a, f) => a + Number(f.salaryPaid),
              0,
            );
            const rem = s.financeRecords.reduce(
              (a, f) => a + Number(f.remaining),
              0,
            );
            return [
              s.name,
              s.role.toUpperCase(),
              this.formatCnic(s.cnic),
              s.contact || "",
              this.fmtDate(s.joinedDate),
              s.isActive ? "ACTIVE" : "INACTIVE",
              this.fmt(s.salary),
              this.fmt(paid),
              this.fmt(rem),
            ];
          }),
          [105, 65, 100, 90, 65, 60, 75, 75, 75],
        );

        // ── § 5 · STAFF LEDGERS ───────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          "§ 5  STAFF LEDGERS (Per-Month Finance)",
          W,
          generated,
        );
        staff.forEach((s) => {
          if (s.financeRecords.length === 0) return;
          if (doc.y > doc.page.height - 130) doc.addPage();
          doc
            .fontSize(9)
            .fillColor(C.blue)
            .font("Helvetica-Bold")
            .text(
              `${s.name}  (${s.role.toUpperCase()})  —  Basic: PKR ${this.fmt(s.salary)}`,
              30,
              doc.y,
            );
          doc.moveDown(0.2);
          this.drawTable(
            doc,
            W,
            30,
            [
              "Month",
              "Salary Due",
              "Salary Paid",
              "Advance Taken",
              "Loan Taken",
              "Remaining",
            ],
            s.financeRecords.map((f) => [
              f.month,
              this.fmt(f.salaryDue),
              this.fmt(f.salaryPaid),
              this.fmt(f.advanceTaken),
              this.fmt(f.loanTaken),
              this.fmt(f.remaining),
            ]),
            [90, 100, 100, 100, 100, 100],
          );
          doc.moveDown(0.5);
        });

        // ── § 6 · STAFF PAYMENTS ──────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          `§ 6  STAFF PAYMENT LOGS (${staffPayments.length} records)`,
          W,
          generated,
        );
        this.drawTable(
          doc,
          W,
          30,
          [
            "Date",
            "Staff",
            "Type",
            "Month",
            "Amount (PKR)",
            "Method",
            "Account",
          ],
          staffPayments.map((p) => [
            this.fmtDate(p.date),
            p.staff?.name || "",
            p.type.toUpperCase(),
            p.month,
            this.fmt(p.amount),
            p.method?.name || "",
            p.account?.label || "Cash",
          ]),
          [70, 130, 65, 70, 80, 100, 100],
        );

        // ── § 7 · OTHER TRANSACTIONS ──────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(
          doc,
          `§ 7  OTHER INCOME & EXPENSE TRANSACTIONS (${otherFinance.length} records)`,
          W,
          generated,
        );
        const income = otherFinance.filter((t) => t.type === "income");
        const expense = otherFinance.filter((t) => t.type === "expense");
        const totIncome = income.reduce((a, t) => a + Number(t.amount), 0);
        const totExpense = expense.reduce((a, t) => a + Number(t.amount), 0);
        doc
          .fontSize(8.5)
          .fillColor(C.green)
          .font("Helvetica-Bold")
          .text(`Total Income: PKR ${this.fmt(totIncome)}    `, 30, doc.y, {
            continued: true,
          });
        doc
          .fontSize(8.5)
          .fillColor(C.red)
          .font("Helvetica-Bold")
          .text(`Total Expense: PKR ${this.fmt(totExpense)}    `);
        doc
          .fontSize(8.5)
          .fillColor(totIncome - totExpense >= 0 ? C.green : C.red)
          .font("Helvetica-Bold")
          .text(
            `Net: PKR ${this.fmt(Math.abs(totIncome - totExpense))} ${totIncome - totExpense >= 0 ? "Surplus" : "Deficit"}`,
          );
        doc.moveDown(0.4);
        this.drawTable(
          doc,
          W,
          30,
          [
            "Date",
            "Type",
            "Category",
            "Amount (PKR)",
            "Account",
            "Party (Sender/Receiver)",
            "Notes",
          ],
          otherFinance.map((t) => [
            this.fmtDate(t.date),
            t.type.toUpperCase(),
            t.category,
            this.fmt(t.amount),
            t.account?.label || "Cash",
            t.senderName || t.receiverName || "—",
            t.notes || "",
          ]),
          [70, 60, 100, 80, 90, 130, 110],
        );

        // ── § 8 · ACCOUNT LEDGERS ─────────────────────────────────────────────
        doc.addPage();
        this.sectionHeader(doc, "§ 8  BANK & ACCOUNT LEDGERS", W, generated);
        accounts.forEach((acc) => {
          if (doc.y > doc.page.height - 130) doc.addPage();
          const opening = Number(acc.openingBalance);
          const current = Number(acc.currentBalance);
          doc
            .fontSize(10)
            .fillColor(C.blue)
            .font("Helvetica-Bold")
            .text(
              `${acc.label}  (${acc.paymentMethod?.type?.toUpperCase() || "CASH"})`,
              30,
              doc.y,
            );
          doc
            .fontSize(8)
            .fillColor(C.gray)
            .font("Helvetica")
            .text(
              `Account #: ${acc.accountNumber || "N/A"}  |  Opening: PKR ${this.fmt(opening)}  |  Current Balance: PKR ${this.fmt(current)}  |  Net Change: PKR ${this.fmt(current - opening)}`,
            );
          doc.moveDown(0.3);

          // Combine student + staff + other transactions for this account
          const rows: string[][] = [
            ...acc.payments.map((p) => [
              this.fmtDate(p.date),
              "Student Fee",
              p.student?.name || "",
              this.fmt(p.amount),
              "+",
            ]),
            ...acc.staffPayments.map((p) => [
              this.fmtDate(p.date),
              `Staff ${p.type}`,
              p.staff?.name || "",
              this.fmt(p.amount),
              "-",
            ]),
            ...acc.otherTransactions.map((t) => [
              this.fmtDate(t.date),
              t.type === "income" ? "Income" : "Expense",
              t.category,
              this.fmt(t.amount),
              t.type === "income" ? "+" : "-",
            ]),
          ].sort((a, b) => a[0].localeCompare(b[0]));

          if (rows.length > 0) {
            this.drawTable(
              doc,
              W,
              30,
              ["Date", "Type", "Description", "Amount (PKR)", "Dr/Cr"],
              rows,
              [80, 100, 200, 90, 50],
            );
          } else {
            doc
              .fontSize(8)
              .fillColor(C.gray)
              .font("Helvetica-Oblique")
              .text("No transactions recorded for this account.", 30);
          }
          doc.moveDown(0.8);
          this.drawHR(doc, C.grayBorder, W);
        });

        doc.end();

        stream.on("finish", () => {
          this.logger.log(`PDF saved: ${outputPath}`);
          resolve(outputPath);
        });
        stream.on("error", (err) => {
          this.logger.error("PDF write stream error", err);
          reject(err);
        });
      } catch (e) {
        this.logger.error("PDF generation crashed", e);
        reject(e);
      }
    });
  }

  // ── Shared Section Header ──────────────────────────────────────────────────
  private sectionHeader(doc: any, title: string, W: number, generated: string) {
    const startY = doc.y;
    doc.rect(30, startY, W, 26).fill(C.blue);
    doc
      .fontSize(10)
      .fillColor(C.white)
      .font("Helvetica-Bold")
      .text(title, 36, startY + 7, { width: W - 12 });
    doc.y = startY + 30;
    doc
      .fontSize(7)
      .fillColor(C.gray)
      .font("Helvetica")
      .text(`Stars Law College — ${generated}`, 30, doc.y, { width: W });
    doc.moveDown(0.5);
  }

  // ── Horizontal Rule ────────────────────────────────────────────────────────
  private drawHR(doc: any, color: string, W: number) {
    const y = doc.y;
    doc
      .moveTo(30, y)
      .lineTo(30 + W, y)
      .strokeColor(color)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.4);
  }

  // ── Table Renderer ─────────────────────────────────────────────────────────
  private drawTable(
    doc: any,
    W: number,
    X: number,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ) {
    const HEADER_H = 20;
    const ROW_H = 16;
    let y = doc.y;

    if (y + HEADER_H > doc.page.height - 50) {
      doc.addPage();
      y = doc.y;
    }

    // Header background
    doc.rect(X, y, W, HEADER_H).fill(C.blueLight);
    let cx = X + 4;
    headers.forEach((h, i) => {
      doc
        .fontSize(7)
        .fillColor(C.blue)
        .font("Helvetica-Bold")
        .text(h.toUpperCase(), cx, y + 5, {
          width: (colWidths[i] || 80) - 6,
          ellipsis: true,
        });
      cx += colWidths[i] || 80;
    });
    y += HEADER_H;

    rows.forEach((row, ri) => {
      if (y + ROW_H > doc.page.height - 45) {
        doc.addPage();
        y = doc.y;
        // Re-draw header
        doc.rect(X, y, W, HEADER_H).fill(C.blueLight);
        let hx = X + 4;
        headers.forEach((h, i) => {
          doc
            .fontSize(7)
            .fillColor(C.blue)
            .font("Helvetica-Bold")
            .text(h.toUpperCase(), hx, y + 5, {
              width: (colWidths[i] || 80) - 6,
              ellipsis: true,
            });
          hx += colWidths[i] || 80;
        });
        y += HEADER_H;
      }

      const bg = ri % 2 === 0 ? C.grayLight : C.white;
      doc.rect(X, y, W, ROW_H).fill(bg);

      let rx = X + 4;
      row.forEach((cell, i) => {
        // Color-code Dr/Cr column (last col often)
        let color = C.black;
        if (cell === "+") color = C.green;
        if (cell === "-") color = C.red;
        doc
          .fontSize(7)
          .fillColor(color)
          .font("Helvetica")
          .text(String(cell ?? ""), rx, y + 4, {
            width: (colWidths[i] || 80) - 6,
            ellipsis: true,
          });
        rx += colWidths[i] || 80;
      });
      y += ROW_H;
    });

    if (rows.length === 0) {
      doc.rect(X, y, W, ROW_H).fill(C.grayLight);
      doc
        .fontSize(7.5)
        .fillColor(C.gray)
        .font("Helvetica-Oblique")
        .text("No records found.", X + 4, y + 4);
      y += ROW_H;
    }

    doc.y = y + 8;
  }

  // ── Formatters ─────────────────────────────────────────────────────────────
  private fmt(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString("en-PK");
  }

  private fmtDate(d: any): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PK", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    });
  }

  private formatCnic(s: string | null | undefined): string {
    if (!s) return "—";
    const d = s.replace(/\D/g, "");
    if (d.length === 13)
      return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
    return s;
  }
}
