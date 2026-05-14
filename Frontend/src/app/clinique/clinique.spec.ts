import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibliothequeComponent } from './clinique';

describe('CliniqueComponent', () => {
  let component: CliniqueComponent;
  let fixture: ComponentFixture<CliniqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliniqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CliniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
