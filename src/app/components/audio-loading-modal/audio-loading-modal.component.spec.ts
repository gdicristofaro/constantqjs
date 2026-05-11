import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioLoadingModalComponent } from './audio-loading-modal.component';

describe('AudioLoadingModalComponent', () => {
  let component: AudioLoadingModalComponent;
  let fixture: ComponentFixture<AudioLoadingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioLoadingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioLoadingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
