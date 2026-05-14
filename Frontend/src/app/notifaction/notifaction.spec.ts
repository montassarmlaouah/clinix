import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Notifaction } from './notifaction';

describe('Notifaction', () => {
  let component: Notifaction;
  let fixture: ComponentFixture<Notifaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Notifaction]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Notifaction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
