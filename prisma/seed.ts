// import { PrismaClient, Prisma } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Seeding Stars Law College database...\n');

//   // ── Departments ─────────────────────────────────────────────────────────────
//   const lawUG = await prisma.department.upsert({
//     where: { code: 'LAW-UG' },
//     update: {},
//     create: {
//       name: 'Law (Undergraduate)',
//       code: 'LAW-UG',
//       offersSem: true,
//       offersAnn: false,
//       semsPerYear: 2,
//       yearsDuration: 4,
//     },
//   });

//   const lawPG = await prisma.department.upsert({
//     where: { code: 'LAW-PG' },
//     update: {},
//     create: {
//       name: 'Law (Postgraduate)',
//       code: 'LAW-PG',
//       offersSem: false,
//       offersAnn: true,
//       yearsDuration: 2,
//     },
//   });

//   console.log(`  ✅ Departments: ${lawUG.name}, ${lawPG.name}`);

//   // ── Fee Structures ──────────────────────────────────────────────────────────
//   await prisma.feeStructure.upsert({
//     where: { id: 1 },
//     update: {},
//     create: { departmentId: lawUG.id, programMode: 'semester', feeAmount: new Prisma.Decimal('25000.00') },
//   });
//   await prisma.feeStructure.upsert({
//     where: { id: 2 },
//     update: {},
//     create: { departmentId: lawPG.id, programMode: 'annual', feeAmount: new Prisma.Decimal('60000.00') },
//   });
//   console.log('  ✅ Fee structures seeded');

//   // ── Sessions ────────────────────────────────────────────────────────────────
//   const session2024 = await prisma.session.upsert({
//     where: { id: 1 },
//     update: {},
//     create: { departmentId: lawUG.id, startYear: 2024, endYear: 2028, label: '2024-2028' },
//   });
//   const session2025 = await prisma.session.upsert({
//     where: { id: 2 },
//     update: {},
//     create: { departmentId: lawUG.id, startYear: 2025, endYear: 2029, label: '2025-2029' },
//   });
//   console.log('  ✅ Sessions seeded');

//   // ── Payment Methods & Accounts ──────────────────────────────────────────────
//   const cashMethod = await prisma.paymentMethod.upsert({
//     where: { name: 'Cash' },
//     update: {},
//     create: { name: 'Cash', type: 'cash' },
//   });
//   const bankMethod = await prisma.paymentMethod.upsert({
//     where: { name: 'Bank Transfer' },
//     update: {},
//     create: { name: 'Bank Transfer', type: 'bank', meta: { bank: 'UBL' } },
//   });
//   const onlineMethod = await prisma.paymentMethod.upsert({
//     where: { name: 'JazzCash' },
//     update: {},
//     create: { name: 'JazzCash', type: 'online' },
//   });

//   await prisma.account.upsert({
//     where: { label: 'Cash Box — Main' },
//     update: {},
//     create: {
//       paymentMethodId: cashMethod.id,
//       label: 'Cash Box — Main',
//       openingBalance: new Prisma.Decimal('0'),
//       currentBalance: new Prisma.Decimal('0'),
//     },
//   });
//   await prisma.account.upsert({
//     where: { label: 'UBL — Main Account' },
//     update: {},
//     create: {
//       paymentMethodId: bankMethod.id,
//       label: 'UBL — Main Account',
//       accountNumber: '1234567890',
//       branch: 'Bahawalpur Main Branch',
//       openingBalance: new Prisma.Decimal('0'),
//       currentBalance: new Prisma.Decimal('0'),
//     },
//   });
//   console.log('  ✅ Payment methods & accounts seeded');

//   // ── Sample Student ──────────────────────────────────────────────────────────
//   const student = await prisma.student.upsert({
//     where: { registrationNo: 'SLC-2024-001' },
//     update: {},
//     create: {
//       name: 'Ali Khan',
//       parentGuardian: 'Ahmed Khan',
//       cnic: '3640123456789',
//       registrationNo: 'SLC-2024-001',
//       rollNo: 'L-101',
//       departmentId: lawUG.id,
//       sessionId: session2024.id,
//       programMode: 'semester',
//       currentSemester: 1,
//       enrolledAt: new Date('2024-09-01'),
//     },
//   });

//   await prisma.studentFinance.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       studentId: student.id,
//       termLabel: '2024-Sem-1',
//       termType: 'semester',
//       feeDue: new Prisma.Decimal('25000.00'),
//       feePaid: new Prisma.Decimal('0'),
//       advanceTaken: new Prisma.Decimal('0'),
//       carryOver: new Prisma.Decimal('0'),
//       remaining: new Prisma.Decimal('25000.00'),
//     },
//   });
//   console.log('  ✅ Sample student seeded');

//   console.log('\n🎉 Seed complete! Ready to build.\n');
// }

// main()
//   .catch((e) => { console.error(e); process.exit(1); })
//   .finally(() => prisma.$disconnect());
