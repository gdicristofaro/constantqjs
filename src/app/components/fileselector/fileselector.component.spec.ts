import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileselectorComponent } from './fileselector.component';

describe('FileselectorComponent', () => {
  let component: FileselectorComponent;
  let fixture: ComponentFixture<FileselectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileselectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileselectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
