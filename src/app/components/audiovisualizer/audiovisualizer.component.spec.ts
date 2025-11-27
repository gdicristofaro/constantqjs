import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AudiovisualizerComponent } from './audiovisualizer.component';

describe('AudiovisualizerComponent', () => {
  let component: AudiovisualizerComponent;
  let fixture: ComponentFixture<AudiovisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AudiovisualizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudiovisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
