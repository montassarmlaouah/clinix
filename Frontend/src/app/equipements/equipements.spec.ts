import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EquipementsComponent } from './equipements';

describe('EquipementsComponent', () => {
  let component: EquipementsComponent;
  let fixture: ComponentFixture<EquipementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipementsComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
