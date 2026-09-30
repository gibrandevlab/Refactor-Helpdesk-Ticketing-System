import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeknisiProfilePage } from './profile.page';

describe('TeknisiProfilePage', () => {
  let component: TeknisiProfilePage;
  let fixture: ComponentFixture<TeknisiProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeknisiProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
