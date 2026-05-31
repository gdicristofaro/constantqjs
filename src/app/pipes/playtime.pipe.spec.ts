import { PlayTimePipe } from './playtime.pipe';

describe('PlayTimePipe', () => {
  let pipe: PlayTimePipe;

  beforeEach(() => {
    pipe = new PlayTimePipe();
  });

  // ─── Output format ───────────────────────────────────────────────────────────
  //
  // Expected format: M:SS.T
  //   M  – minutes (no zero-padding, zero displayed when 0)
  //   SS – seconds, always 2 digits (zero-padded)
  //   T  – tenths of a second, always exactly 1 digit

  const FORMAT_REGEX = /^\d+:\d{2}\.\d$/;

  describe('output format', () => {
    const samples = [0, 0.5, 1, 9.9, 10, 59, 59.9, 60, 61.3, 600, 3661.7];

    samples.forEach(value => {
      it(`should match M:SS.T format for input ${value}`, () => {
        expect(pipe.transform(value)).toMatch(FORMAT_REGEX);
      });
    });
  });

  // ─── Seconds: always 2 digits ─────────────────────────────────────────────

  describe('seconds are always 2 digits', () => {
    it('should zero-pad single-digit seconds (1 → "0:01.0")', () => {
      expect(pipe.transform(1)).toBe('0:01.0');
    });

    it('should zero-pad 0 seconds (0 → "0:00.0")', () => {
      expect(pipe.transform(0)).toBe('0:00.0');
    });

    it('should NOT pad double-digit seconds (10 → "0:10.0")', () => {
      expect(pipe.transform(10)).toBe('0:10.0');
    });

    it('should show 2 digits at 59 seconds ("0:59.0")', () => {
      expect(pipe.transform(59)).toBe('0:59.0');
    });

    it('should reset seconds to "00" at exactly 1 minute (60 → "1:00.0")', () => {
      expect(pipe.transform(60)).toBe('1:00.0');
    });

    it('should zero-pad seconds in the middle of a minute (61 → "1:01.0")', () => {
      expect(pipe.transform(61)).toBe('1:01.0');
    });
  });

  // ─── Tenths: always exactly 1 digit ──────────────────────────────────────

  describe('tenths of a second are always 1 digit', () => {
    it('should show 0 tenths when value is a whole number (5 → "0:05.0")', () => {
      expect(pipe.transform(5)).toBe('0:05.0');
    });

    it('should show 1 tenth (5.1 → "0:05.1")', () => {
      expect(pipe.transform(5.1)).toBe('0:05.1');
    });

    it('should show 5 tenths (5.5 → "0:05.5")', () => {
      expect(pipe.transform(5.5)).toBe('0:05.5');
    });

    it('should show 9 tenths (5.9 → "0:05.9")', () => {
      expect(pipe.transform(5.9)).toBe('0:05.9');
    });

    it('should truncate sub-tenth precision – not round (5.99 → "0:05.9")', () => {
      // Math.floor((5.99 * 10) % 10) === 9, not 10
      expect(pipe.transform(5.99)).toBe('0:05.9');
    });

    it('should truncate sub-tenth precision near a second boundary (59.99 → "0:59.9")', () => {
      expect(pipe.transform(59.99)).toBe('0:59.9');
    });
  });

  // ─── Minutes: zero is displayed, no zero-padding ──────────────────────────

  describe('minutes display', () => {
    it('should show 0 minutes when value is below 60 seconds (0:SS.T)', () => {
      expect(pipe.transform(0)).toMatch(/^0:/);
    });

    it('should show 0 minutes for 59.9 seconds', () => {
      expect(pipe.transform(59.9)).toMatch(/^0:/);
    });

    it('should show 1 minute at exactly 60 seconds', () => {
      expect(pipe.transform(60)).toMatch(/^1:/);
    });

    it('should show 1 minute at 61 seconds', () => {
      expect(pipe.transform(61)).toBe('1:01.0');
    });

    it('should show 2 minutes at 120 seconds', () => {
      expect(pipe.transform(120)).toBe('2:00.0');
    });

    it('should show 10 minutes (no zero-padding) at 600 seconds', () => {
      expect(pipe.transform(600)).toBe('10:00.0');
    });

    it('should show 61 minutes at 3660 seconds', () => {
      expect(pipe.transform(3660)).toBe('61:00.0');
    });
  });

  // ─── Specific known values ────────────────────────────────────────────────

  describe('known full-format values', () => {
    it('0 → "0:00.0"', () => expect(pipe.transform(0)).toBe('0:00.0'));
    it('0.5 → "0:00.5"', () => expect(pipe.transform(0.5)).toBe('0:00.5'));
    it('9.9 → "0:09.9"', () => expect(pipe.transform(9.9)).toBe('0:09.9'));
    it('60 → "1:00.0"', () => expect(pipe.transform(60)).toBe('1:00.0'));
    it('90.3 → "1:30.3"', () => expect(pipe.transform(90.3)).toBe('1:30.3'));
    it('3661.7 → "61:01.7"', () => expect(pipe.transform(3661.7)).toBe('61:01.7'));
  });
});
