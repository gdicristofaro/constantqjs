import { MegabytesPipe } from './megabytes.pipe';

describe('Megabytes', () => {
  it('create an instance', () => {
    const pipe = new MegabytesPipe();
    expect(pipe).toBeTruthy();
  });
});
