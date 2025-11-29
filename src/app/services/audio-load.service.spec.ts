import { TestBed } from '@angular/core/testing';

import { AudioLoadService } from './audio-load.service';

describe('AudioLoadService', () => {
  let service: AudioLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioLoadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
