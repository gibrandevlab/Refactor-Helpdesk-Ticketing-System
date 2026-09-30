import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersDashboardPage } from './dashboard.page';

describe('UsersDashboardPage', () => {
  let component: UsersDashboardPage;
  let fixture: ComponentFixture<UsersDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
