import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersProfilePage } from './profile.page';

describe('UsersProfilePage', () => {
  let component: UsersProfilePage;
  let fixture: ComponentFixture<UsersProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
