import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Presences } from './presences';

describe('Presences', () => {
  let component: Presences;
  let fixture: ComponentFixture<Presences>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Presences]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Presences);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
