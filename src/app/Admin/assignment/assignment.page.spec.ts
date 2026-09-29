import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentTicketPage } from './assignment.page';

describe('AssignmentTicketPage', () => {
  let component: AssignmentTicketPage;
  let fixture: ComponentFixture<AssignmentTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
