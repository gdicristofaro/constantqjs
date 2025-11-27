import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedfilesComponent } from './recommendedfiles.component';

describe('RecommendedfilesComponent', () => {
  let component: RecommendedfilesComponent;
  let fixture: ComponentFixture<RecommendedfilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecommendedfilesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecommendedfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
