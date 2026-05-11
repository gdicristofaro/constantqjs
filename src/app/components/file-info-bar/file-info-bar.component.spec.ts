import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileInfoBarComponent } from './file-info-bar.component';

describe('FileInfoBarComponent', () => {
  let component: FileInfoBarComponent;
  let fixture: ComponentFixture<FileInfoBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileInfoBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileInfoBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
