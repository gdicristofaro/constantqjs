import { MegabytesPipe } from './megabytes.pipe';

describe('MegabytesPipe', () => {
  let pipe: MegabytesPipe;

  beforeEach(() => {
    pipe = new MegabytesPipe();
  });

  // ─── Corner cases ────────────────────────────────────────────────────────────

  describe('corner cases', () => {
    it('should return "-" for NaN', () => {
      expect(pipe.transform(NaN)).toBe('-');
    });

    it('should return "-" for Infinity', () => {
      expect(pipe.transform(Infinity)).toBe('-');
    });

    it('should return "-" for -Infinity', () => {
      expect(pipe.transform(-Infinity)).toBe('-');
    });

    it('should handle 0 bytes', () => {
      const result = pipe.transform(0);
      expect(result).toBeDefined();
    });

    it('should use precision 1 by default', () => {
      // 1 kB = 1024 bytes → "1.0 kB"
      expect(pipe.transform(1024)).toBe('1.0 kB');
    });

    it('should respect a custom precision of 0', () => {
      expect(pipe.transform(1024, 0)).toBe('1 kB');
    });

    it('should respect a custom precision of 3', () => {
      expect(pipe.transform(1536, 3)).toBe('1.500 kB');
    });
  });

  // ─── bytes ───────────────────────────────────────────────────────────────────

  describe('bytes unit', () => {
    it('should display 1 byte', () => {
      expect(pipe.transform(1)).toBe('1.0 bytes');
    });

    it('should display 512 bytes', () => {
      expect(pipe.transform(512)).toBe('512.0 bytes');
    });

    it('should display 1023 bytes (just below 1 kB)', () => {
      expect(pipe.transform(1023)).toBe('1023.0 bytes');
    });
  });

  // ─── kB ──────────────────────────────────────────────────────────────────────

  describe('kB unit', () => {
    it('should display exactly 1 kB (1 024 bytes)', () => {
      expect(pipe.transform(1024)).toBe('1.0 kB');
    });

    it('should display 1.5 kB (1 536 bytes)', () => {
      expect(pipe.transform(1536)).toBe('1.5 kB');
    });

    it('should display the upper boundary – just below 1 MB', () => {
      const justBelowMB = 1024 * 1024 - 1; // 1 048 575 bytes
      expect(pipe.transform(justBelowMB)).toBe('1024.0 kB');
    });
  });

  // ─── MB ──────────────────────────────────────────────────────────────────────

  describe('MB unit', () => {
    it('should display exactly 1 MB (1 048 576 bytes)', () => {
      expect(pipe.transform(1024 ** 2)).toBe('1.0 MB');
    });

    it('should display 2.5 MB', () => {
      expect(pipe.transform(2.5 * 1024 ** 2)).toBe('2.5 MB');
    });

    it('should display the upper boundary – just below 1 GB', () => {
      const justBelowGB = 1024 ** 3 - 1;
      expect(pipe.transform(justBelowGB)).toBe('1024.0 MB');
    });
  });

  // ─── GB ──────────────────────────────────────────────────────────────────────

  describe('GB unit', () => {
    it('should display exactly 1 GB (1 073 741 824 bytes)', () => {
      expect(pipe.transform(1024 ** 3)).toBe('1.0 GB');
    });

    it('should display 500 GB', () => {
      expect(pipe.transform(500 * 1024 ** 3)).toBe('500.0 GB');
    });

    it('should display the upper boundary – just below 1 TB', () => {
      const justBelowTB = 1024 ** 4 - 1;
      expect(pipe.transform(justBelowTB)).toBe('1024.0 GB');
    });
  });

  // ─── TB ──────────────────────────────────────────────────────────────────────

  describe('TB unit', () => {
    it('should display exactly 1 TB (1 099 511 627 776 bytes)', () => {
      expect(pipe.transform(1024 ** 4)).toBe('1.0 TB');
    });

    it('should display 8 TB', () => {
      expect(pipe.transform(8 * 1024 ** 4)).toBe('8.0 TB');
    });

    it('should display the upper boundary – just below 1 PB', () => {
      const justBelowPB = 2 * 1024 ** 4 - 1;
      expect(pipe.transform(justBelowPB)).toBe('2.0 TB');
    });
  });

  // ─── PB ──────────────────────────────────────────────────────────────────────

  describe('PB unit', () => {
    it('should display exactly 1 PB (1 125 899 906 842 624 bytes)', () => {
      expect(pipe.transform(1024 ** 5)).toBe('1.0 PB');
    });

    it('should display 10 PB', () => {
      expect(pipe.transform(10 * 1024 ** 5)).toBe('10.0 PB');
    });
  });
});
