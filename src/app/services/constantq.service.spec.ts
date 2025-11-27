import { TestBed } from '@angular/core/testing';

import { ConstantqService } from './constantq.service';

describe('ConstantqService', () => {
  let service: ConstantqService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConstantqService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
