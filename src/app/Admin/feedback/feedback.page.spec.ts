import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LaporanFeedbackPage } from './feedback.page';

describe('LaporanFeedbackPage', () => {
  let component: LaporanFeedbackPage;
  let fixture: ComponentFixture<LaporanFeedbackPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LaporanFeedbackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
