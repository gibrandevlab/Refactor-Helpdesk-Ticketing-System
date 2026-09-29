import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiwayatTiketPage } from './riwayat.page';

describe('RiwayatTiketPage', () => {
  let component: RiwayatTiketPage;
  let fixture: ComponentFixture<RiwayatTiketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RiwayatTiketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
