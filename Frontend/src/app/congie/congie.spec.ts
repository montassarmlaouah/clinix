import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Congie } from './congie';

describe('Congie', () => {
  let component: Congie;
  let fixture: ComponentFixture<Congie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Congie]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Congie);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
