import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListTicketPage } from './list.page';

describe('ListTicketPage', () => {
  let component: ListTicketPage;
  let fixture: ComponentFixture<ListTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
