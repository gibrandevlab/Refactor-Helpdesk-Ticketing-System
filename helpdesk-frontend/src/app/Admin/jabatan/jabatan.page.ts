import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, IonicSafeString } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline, searchOutline, addOutline, createOutline, trashOutline,
  chevronBackOutline, chevronForwardOutline, closeOutline, saveOutline
} from 'ionicons/icons';

import { JabatanService } from '../../services/Jabatan.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface Jabatan {
  id: number;
  nama: string;
}

@Component({
  selector: 'app-jabatan',
  templateUrl: './jabatan.page.html',
  styleUrls: ['./jabatan.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class JabatanPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'jabatan';

  // ===== DATA JABATAN (dari API) =====
  jabatanList: Jabatan[] = [];
  isLoading = false;
  errorMessage = '';

  // ==== FILTER ====
  searchTerm = '';
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
    private jabatanService: JabatanService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, searchOutline, addOutline, createOutline, trashOutline,
      chevronBackOutline, chevronForwardOutline, closeOutline, saveOutline
    });
  }

  ngOnInit() {
    this.loadJabatan();
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
  loadJabatan() {
    this.isLoading = true;
    this.errorMessage = '';

    this.jabatanService.getAll().subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        this.jabatanList = rows.map((row: any): Jabatan => ({
          id: row.id_jabatan,
          nama: row.nama_jabatan,
        }));
        this.isLoading = false;
        this.onFilterChange();
      },
      error: (err: any) => {
        console.error('Gagal memuat data jabatan:', err);
        this.errorMessage = 'Gagal memuat data jabatan.';
        this.isLoading = false;
      }
    });
  }

  // ===== LOGIKA FILTER & PAGINATION =====
  get filteredJabatan(): Jabatan[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.jabatanList;
    return this.jabatanList.filter((j) =>
      j.nama.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredJabatan.length / this.pageSize));
  }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pagedJabatan(): Jabatan[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredJabatan.slice(start, start + this.pageSize);
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

  openEditModal(j: Jabatan) {
    this.isEditing = true;
    this.selectedId = j.id;
    this.formData = { ...j };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // ===== SIMPAN (CREATE / UPDATE) VIA API =====
  simpanJabatan() {
    if (!this.formData.nama) {
      this.showToast('Nama jabatan wajib diisi!', 'warning');
      return;
    }

    const request$ = this.isEditing && this.selectedId !== null
      ? this.jabatanService.update(this.selectedId, this.formData.nama)
      : this.jabatanService.create(this.formData.nama);

    request$.subscribe({
      next: () => {
        this.closeModal();
        this.showToast(this.isEditing ? 'Data jabatan berhasil diperbarui!' : 'Jabatan berhasil ditambahkan!', 'success');
        this.loadJabatan();
      },
      error: (err: any) => {
        console.error('Gagal menyimpan jabatan:', err);
        this.showToast(err?.error?.message || 'Gagal menyimpan data jabatan.', 'danger');
      }
    });
  }

  // ===== HAPUS VIA API =====
  async hapusJabatan(j: Jabatan) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Jabatan',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus jabatan <strong>${j.nama}</strong>?`),
      cssClass: 'custom-alert-dialog',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.jabatanService.delete(j.id).subscribe({
              next: () => {
                this.showToast('Jabatan berhasil dihapus!', 'success');
                this.loadJabatan();
              },
              error: (err: any) => {
                console.error('Gagal menghapus jabatan:', err);
                this.showToast(err?.error?.message || 'Gagal menghapus jabatan (kemungkinan masih dipakai data lain).', 'danger');
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
