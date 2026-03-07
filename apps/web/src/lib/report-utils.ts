import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTime } from "./utils";

interface ExportOptions {
  title: string;
  filename: string;
  columns: string[];
  data: any[][];
  summary?: { label: string; value: string }[];
}

export function exportToPDF({
  title,
  filename,
  columns,
  data,
  summary,
}: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = formatDateTime(new Date());

  // Branded Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("STARS LAW COLLEGE", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`${title} REPORT`, pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on: ${now}`, pageWidth / 2, 36, { align: "center" });

  // Add Summary Section if exists
  let startY = 45;
  if (summary && summary.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);

    summary.forEach((item, index) => {
      const x = 14 + (index % 2) * 90;
      const y = startY + Math.floor(index / 2) * 7;
      doc.text(`${item.label}:`, x, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, x + 35, y);
      doc.setFont("helvetica", "bold");
    });
    startY += Math.ceil(summary.length / 2) * 10;
  }

  // Draw Table
  autoTable(doc, {
    startY: startY,
    head: [columns],
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85], // Slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    margin: { top: 40 },
  });

  // Save the PDF
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`${filename}_${dateStr}.pdf`);
}
