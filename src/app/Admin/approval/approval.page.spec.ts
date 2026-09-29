import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApprovalTicketPage } from './approval.page';

describe('ApprovalTicketPage', () => {
  let component: ApprovalTicketPage;
  let fixture: ComponentFixture<ApprovalTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
