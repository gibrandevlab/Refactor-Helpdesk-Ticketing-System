import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProsesTiketPage } from './proses.page';

describe('ProsesTiketPage', () => {
  let component: ProsesTiketPage;
  let fixture: ComponentFixture<ProsesTiketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProsesTiketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
