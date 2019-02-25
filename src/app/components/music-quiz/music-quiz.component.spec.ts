import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicQuizComponent } from './music-quiz.component';

describe('MusicQuizComponent', () => {
  let component: MusicQuizComponent;
  let fixture: ComponentFixture<MusicQuizComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MusicQuizComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MusicQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
