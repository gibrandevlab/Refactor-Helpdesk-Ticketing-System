import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeknisiDashboardPage } from './dashborad.page';

describe('TeknisiDashboardPage', () => {
  let component: TeknisiDashboardPage;
  let fixture: ComponentFixture<TeknisiDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeknisiDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
