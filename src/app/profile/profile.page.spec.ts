import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProfilePage } from './profile.page';

describe('AdminProfilePage', () => {
  let component: AdminProfilePage;
  let fixture: ComponentFixture<AdminProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
