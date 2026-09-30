import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, ToastController, AlertController, IonicSafeString } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline, businessOutline, addOutline, createOutline, trashOutline,
  chevronBackOutline, chevronForwardOutline, closeOutline, saveOutline
} from 'ionicons/icons';

import { DepartemenService } from '../../services/departemen.services';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface Departemen {
  id: number;
  nama: string;
}

@Component({
  selector: 'app-departemen',
  templateUrl: './departemen.page.html',
  styleUrls: ['./departemen.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent, RouterLink],
})
export class DepartemenPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'departemen';

  // ===== DATA DEPARTEMEN (dari API) =====
  departemenList: Departemen[] = [];
  isLoading = false;
  errorMessage = '';

  // ==== STATISTIK =====
  get totalDepartemen() { return this.departemenList.length; }

  // ==== FILTER ====
  searchTerm = '';

  // ==== PAGINATION ====
  currentPage = 1;
  pageSize = 10;

  // ==== STATE MODAL ====
  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  formData: any = {
    nama: '',
  };

  constructor(
    private router: Router,
    private departemenService: DepartemenService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, businessOutline, addOutline, createOutline, trashOutline,
      chevronBackOutline, chevronForwardOutline, closeOutline, saveOutline
    });
  }

  ngOnInit() {
    this.loadDepartemen();
  }

  /** Helper Toast Notification */
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: `custom-toast toast-${color}`,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  // ===== AMBIL DATA DARI API =====
  loadDepartemen() {
    this.isLoading = true;
    this.errorMessage = '';

    this.departemenService.getAll().subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        this.departemenList = rows.map((row: any): Departemen => ({
          id: row.id_departemen,
          nama: row.nama_departemen,
        }));
        this.isLoading = false;
        this.onFilterChange();
      },
      error: (err: any) => {
        console.error('Gagal memuat data departemen:', err);
        this.errorMessage = 'Gagal memuat data departemen.';
        this.isLoading = false;
      }
    });
  }

  // ===== LOGIKA FILTER & PAGINATION =====
  get filteredDepartemen(): Departemen[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.departemenList;
    return this.departemenList.filter((d) =>
      d.nama.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDepartemen.length / this.pageSize));
  }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pagedDepartemen(): Departemen[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDepartemen.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  // ===== FUNGSI MODAL =====
  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.formData = { nama: '' };
    this.isModalOpen = true;
  }

  openEditModal(d: Departemen) {
    this.isEditing = true;
    this.selectedId = d.id;
    this.formData = { ...d };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // ===== SIMPAN (CREATE / UPDATE) VIA API =====
  simpanDepartemen() {
    if (!this.formData.nama) {
      this.showToast('Nama departemen wajib diisi!', 'warning');
      return;
    }

    const request$ = this.isEditing && this.selectedId !== null
      ? this.departemenService.update(this.selectedId, this.formData.nama)
      : this.departemenService.create(this.formData.nama);

    request$.subscribe({
      next: () => {
        this.closeModal();
        this.showToast(this.isEditing ? 'Data departemen berhasil diperbarui!' : 'Departemen berhasil ditambahkan!', 'success');
        this.loadDepartemen();
      },
      error: (err: any) => {
        console.error('Gagal menyimpan departemen:', err);
        this.showToast(err?.error?.message || 'Gagal menyimpan data departemen.', 'danger');
      }
    });
  }

  // ===== HAPUS VIA API =====
  async hapusDepartemen(d: Departemen) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Departemen',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus departemen <strong>${d.nama}</strong>?`),
      cssClass: 'custom-alert-dialog',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.departemenService.delete(d.id).subscribe({
              next: () => {
                this.showToast('Departemen berhasil dihapus!', 'success');
                this.loadDepartemen();
              },
              error: (err: any) => {
                console.error('Gagal menghapus departemen:', err);
                this.showToast(err?.error?.message || 'Gagal menghapus departemen (kemungkinan masih dipakai data lain).', 'danger');
              }
            });
          }
        }
      ]
    });

    await alertEl.present();
  }

  // ===== NAVIGASI & SIDEBAR =====
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  setActiveMenu(menu: string) {
    this.activeMenu = menu;
    if (window.innerWidth < 1024) this.isSidebarOpen = false;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
