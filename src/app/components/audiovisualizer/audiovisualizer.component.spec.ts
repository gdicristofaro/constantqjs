import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioVisualizerComponent } from './audiovisualizer.component';

describe('AudioVisualizerComponent', () => {
  let component: AudioVisualizerComponent;
  let fixture: ComponentFixture<AudioVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioVisualizerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioVisualizerComponent);

    fixture.componentRef.setInput('audioFileData', {
      title: 'Test Audio',
      noteLetters: ['C4', 'D4', 'E4'],
      fps: 10,
    });
    fixture.componentRef.setInput('constantQData', {
      graphMax: 1,
      constantQData: [
        [0.5, 0.2, 0.1],
        [0.6, 0.3, 0.2],
      ],
    });

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
