import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UrlSelectorComponent } from './urlselector.component';

describe('UrlSelectorComponent', () => {
  let component: UrlSelectorComponent;
  let fixture: ComponentFixture<UrlSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UrlSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UrlSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
