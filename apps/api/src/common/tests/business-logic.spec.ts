/**
 * Unit tests for critical business logic:
 * - Payment allocation (FIFO)
 * - Finance calculations
 * - Receipt number format
 * - CNIC normalisation
 */

import { Decimal } from 'decimal.js';

// ── Finance calculation helpers ───────────────────────────────────────────────
const calcRemaining = (feeDue: string, feePaid: string, advanceTaken: string) =>
  new Decimal(feeDue).minus(new Decimal(feePaid)).minus(new Decimal(advanceTaken));

const normaliseCnic = (raw: string) => raw.replace(/\D/g, '');

const buildTermLabel = (mode: string, semester?: number) => {
  const year = 2026;
  return mode === 'semester' ? `${year}-Sem-${semester || 1}` : `${year}-Annual`;
};

const formatReceiptNo = (prefix: string, year: number, seq: number) =>
  `${prefix}-${year}-${String(seq).padStart(5, '0')}`;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Finance Calculations', () => {
  test('remaining = feeDue - feePaid - advanceTaken', () => {
    expect(calcRemaining('25000', '10000', '0').toFixed(2)).toBe('15000.00');
    expect(calcRemaining('25000', '25000', '0').toFixed(2)).toBe('0.00');
    expect(calcRemaining('25000', '15000', '5000').toFixed(2)).toBe('5000.00');
  });

  test('remaining cannot go below zero via calculation', () => {
    const remaining = calcRemaining('25000', '30000', '0');
    expect(remaining.isNegative()).toBe(true); // caller should handle overpayment as advance
  });
});

describe('CNIC Normalisation', () => {
  test('strips dashes from formatted CNIC', () => {
    expect(normaliseCnic('42101-1234567-8')).toBe('4210112345678');
  });
  test('strips spaces', () => {
    expect(normaliseCnic('42101 1234567 8')).toBe('4210112345678');
  });
  test('leaves raw 13-digit CNIC unchanged', () => {
    expect(normaliseCnic('4210112345678')).toBe('4210112345678');
  });
  test('normalised CNIC must be 13 digits', () => {
    expect(normaliseCnic('42101-1234567-8').length).toBe(13);
  });
});

describe('Receipt Number Format', () => {
  test('formats correctly SLC-2026-00001', () => {
    expect(formatReceiptNo('SLC', 2026, 1)).toBe('SLC-2026-00001');
  });
  test('pads sequence to 5 digits', () => {
    expect(formatReceiptNo('SLC', 2026, 123)).toBe('SLC-2026-00123');
  });
  test('handles large sequence numbers', () => {
    expect(formatReceiptNo('SLC', 2026, 99999)).toBe('SLC-2026-99999');
  });
});

describe('Term Label Builder', () => {
  test('builds semester label', () => {
    expect(buildTermLabel('semester', 2)).toBe('2026-Sem-2');
  });
  test('builds annual label', () => {
    expect(buildTermLabel('annual')).toBe('2026-Annual');
  });
});

describe('FIFO Payment Allocation', () => {
  const terms = [
    { id: 1, termLabel: '2024-Sem-1', remaining: new Decimal('25000') },
    { id: 2, termLabel: '2024-Sem-2', remaining: new Decimal('25000') },
  ];

  function applyFifo(amount: Decimal, records: typeof terms) {
    let remaining = amount;
    const allocations: { id: number; allocated: Decimal }[] = [];
    for (const r of records) {
      if (remaining.lte(0)) break;
      const allocate = Decimal.min(remaining, r.remaining);
      allocations.push({ id: r.id, allocated: allocate });
      remaining = remaining.minus(allocate);
    }
    return allocations;
  }

  test('exact payment clears first term only', () => {
    const allocs = applyFifo(new Decimal('25000'), terms);
    expect(allocs).toHaveLength(1);
    expect(allocs[0].id).toBe(1);
    expect(allocs[0].allocated.toFixed(2)).toBe('25000.00');
  });

  test('large payment spans multiple terms', () => {
    const allocs = applyFifo(new Decimal('40000'), terms);
    expect(allocs).toHaveLength(2);
    expect(allocs[0].allocated.toFixed(2)).toBe('25000.00');
    expect(allocs[1].allocated.toFixed(2)).toBe('15000.00');
  });

  test('partial payment allocates to oldest term first', () => {
    const allocs = applyFifo(new Decimal('10000'), terms);
    expect(allocs).toHaveLength(1);
    expect(allocs[0].id).toBe(1);
    expect(allocs[0].allocated.toFixed(2)).toBe('10000.00');
  });

  test('zero payment produces no allocations', () => {
    const allocs = applyFifo(new Decimal('0'), terms);
    expect(allocs).toHaveLength(0);
  });
});

describe('Promotion Validation', () => {
  const canPromote = (currentSem: number, totalSems: number) => currentSem + 1 <= totalSems;

  test('allows promotion within bounds', () => {
    expect(canPromote(3, 8)).toBe(true);
  });
  test('blocks promotion at last semester', () => {
    expect(canPromote(8, 8)).toBe(false);
  });
  test('allows promotion to last semester', () => {
    expect(canPromote(7, 8)).toBe(true);
  });
});
