/**
 * Tests for payment calculation utilities
 */

import {
  calculateDueDate,
  calculatePaymentStatus,
  isImmediateCash,
  canBeUsedForSettlement,
  getDaysUntilDue,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from '../paymentCalculations';

// Test data
const testDate = new Date('2024-01-15');
const immediateCashMethod = {
  type: 'immediate_cash',
  isImmediateCash: true
};
const standardCreditMethod = {
  type: 'standard_credit',
  daysAllowed: 30,
  isImmediateCash: false
};
const endOfMonthMethod = {
  type: 'end_of_month',
  daysAllowed: 5,
  isImmediateCash: false
};

describe('Payment Calculations', () => {
  describe('calculateDueDate', () => {
    test('immediate_cash should return same date', () => {
      const result = calculateDueDate(testDate, immediateCashMethod);
      expect(result).toEqual(testDate);
    });

    test('standard_credit should add days', () => {
      const result = calculateDueDate(testDate, standardCreditMethod);
      const expected = new Date('2024-02-14'); // Jan 15 + 30 days
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    test('end_of_month should calculate end of month + days', () => {
      const result = calculateDueDate(testDate, endOfMonthMethod);
      const expected = new Date('2024-02-05'); // End of Jan (Jan 31) + 5 days
      expect(result.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('calculatePaymentStatus', () => {
    test('immediate cash should be paid', () => {
      const result = calculatePaymentStatus(immediateCashMethod, testDate);
      expect(result).toBe('paid');
    });

    test('pending credit should be pending', () => {
      const result = calculatePaymentStatus(standardCreditMethod, testDate);
      expect(result).toBe('pending');
    });

    test('overdue credit should be overdue', () => {
      const overdueDate = new Date('2024-01-01'); // 15 days before test date
      const result = calculatePaymentStatus(standardCreditMethod, overdueDate, testDate);
      expect(result).toBe('overdue');
    });
  });

  describe('isImmediateCash', () => {
    test('should return true for immediate cash', () => {
      expect(isImmediateCash(immediateCashMethod)).toBe(true);
    });

    test('should return false for credit methods', () => {
      expect(isImmediateCash(standardCreditMethod)).toBe(false);
    });
  });

  describe('canBeUsedForSettlement', () => {
    test('immediate cash can be used for settlement', () => {
      expect(canBeUsedForSettlement(immediateCashMethod)).toBe(true);
    });

    test('credit methods cannot be used for settlement', () => {
      expect(canBeUsedForSettlement(standardCreditMethod)).toBe(false);
    });
  });

  describe('getPaymentStatusColor', () => {
    test('should return correct colors', () => {
      expect(getPaymentStatusColor('paid')).toBe('success');
      expect(getPaymentStatusColor('pending')).toBe('warning');
      expect(getPaymentStatusColor('overdue')).toBe('error');
      expect(getPaymentStatusColor('settled')).toBe('info');
    });
  });

  describe('getPaymentStatusLabel', () => {
    test('should return correct labels', () => {
      expect(getPaymentStatusLabel('paid')).toBe('Paid');
      expect(getPaymentStatusLabel('pending')).toBe('Pending');
      expect(getPaymentStatusLabel('overdue')).toBe('Overdue');
      expect(getPaymentStatusLabel('settled')).toBe('Settled');
    });
  });
});
