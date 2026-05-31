import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedFilesComponent } from './recommendedfiles.component';

describe('RecommendedFilesComponent', () => {
  let component: RecommendedFilesComponent;
  let fixture: ComponentFixture<RecommendedFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedFilesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendedFilesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedFile', { type: 'file', audioFile: null });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
