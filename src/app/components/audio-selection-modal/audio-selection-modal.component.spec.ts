import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioSelectionModalComponent } from './audio-selection-modal.component';

describe('AudioSelectionModalComponent', () => {
  let component: AudioSelectionModalComponent;
  let fixture: ComponentFixture<AudioSelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioSelectionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
