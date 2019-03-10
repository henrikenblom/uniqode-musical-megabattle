import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UseUniqodeAccountWarningComponent } from './use-uniqode-account-warning.component';

describe('UseUniqodeAccountWarningComponent', () => {
  let component: UseUniqodeAccountWarningComponent;
  let fixture: ComponentFixture<UseUniqodeAccountWarningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UseUniqodeAccountWarningComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UseUniqodeAccountWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
