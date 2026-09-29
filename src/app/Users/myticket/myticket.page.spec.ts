import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyTicketPage } from './myticket.page';

describe('MyTicketPage', () => {
  let component: MyTicketPage;
  let fixture: ComponentFixture<MyTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
