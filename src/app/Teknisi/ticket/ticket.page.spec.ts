import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeknisiTicketPage } from './ticket.page';

describe('TeknisiTicketPage', () => {
  let component: TeknisiTicketPage;
  let fixture: ComponentFixture<TeknisiTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeknisiTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
