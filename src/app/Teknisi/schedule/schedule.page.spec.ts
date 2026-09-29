import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleTersediaPage } from './schedule.page';

describe('ScheduleTersediaPage', () => {
  let component: ScheduleTersediaPage;
  let fixture: ComponentFixture<ScheduleTersediaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleTersediaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
