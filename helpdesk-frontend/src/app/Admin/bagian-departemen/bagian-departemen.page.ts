import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, IonicSafeString } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  menuOutline, addOutline, createOutline, trashOutline,
  chevronBackOutline, chevronForwardOutline, closeOutline,
  saveOutline, folderOpenOutline
} from 'ionicons/icons';

import { BagianDepartemenService } from '../../services/bagian-departemen.service';
import { DepartemenService } from '../../services/departemen.services';
import { BagianDepartemen } from '../../models/Bagian departemen.model ';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface DepartemenOption {
  idDepartemen: number;
  namaDepartemen: string;
}

@Component({
  selector: 'app-bagian-departemen',
  templateUrl: './bagian-departemen.page.html',
  styleUrls: ['./bagian-departemen.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class BagianDepartemenPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'bagian-departemen';

  bagianList: BagianDepartemen[] = [];
  private departemenIdMap: DepartemenOption[] = [];

  searchTerm = '';
  filterDepartemen = '';
  departemenOptions: string[] = [];

  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  formData: { departemen: string; bagian: string } = {
    departemen: '',
    bagian: '',
  };

  constructor(
    private router: Router,
    private bagianDepartemenService: BagianDepartemenService,
    private departemenService: DepartemenService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, addOutline, createOutline, trashOutline,
      chevronBackOutline, chevronForwardOutline, closeOutline,
      saveOutline, folderOpenOutline
    });
  }

  ngOnInit() {
    this.loadBagianDepartemen();
    this.loadDepartemenIdMap();
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

  private loadBagianDepartemen() {
    this.bagianDepartemenService.getAll().subscribe({
      next: (res) => {
        this.bagianList = res;
        this.buildFilterOptions();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Gagal mengambil data bagian departemen:', err);
        this.showToast('Gagal mengambil data Bagian Departemen dari server.', 'danger');
      },
    });
  }

  private loadDepartemenIdMap() {
    this.departemenService.getAll().subscribe({
      next: (res: any) => {
        const rows = res?.data ?? res ?? [];
        this.departemenIdMap = rows.map((d: any) => ({
          idDepartemen: d.id_departemen,
          namaDepartemen: d.nama_departemen,
        }));
      },
      error: (err: HttpErrorResponse) => {
        console.error('Gagal mengambil data departemen:', err);
      },
    });
  }

  private buildFilterOptions() {
    this.departemenOptions = [...new Set(this.bagianList.map((b) => b.departemen))];
  }

  get filteredBagian(): BagianDepartemen[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.bagianList.filter((b) => {
      const matchSearch =
        !term ||
        b.departemen.toLowerCase().includes(term) ||
        b.bagian.toLowerCase().includes(term);
      const matchDept = !this.filterDepartemen || b.departemen === this.filterDepartemen;
      return matchSearch && matchDept;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBagian.length / this.pageSize));
  }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pagedBagian(): BagianDepartemen[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBagian.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.formData = { departemen: '', bagian: '' };
    this.isModalOpen = true;
  }

  openEditModal(item: BagianDepartemen) {
    this.isEditing = true;
    this.selectedId = item.idBagian;
    this.formData = { departemen: item.departemen, bagian: item.bagian };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  simpanBagian() {
    if (!this.formData.departemen || !this.formData.bagian) {
      this.showToast('Departemen dan Bagian wajib diisi!', 'warning');
      return;
    }

    const matched = this.departemenIdMap.find((d) => d.namaDepartemen === this.formData.departemen);
    if (!matched) {
      this.showToast('Departemen tidak ditemukan / data departemen belum termuat.', 'warning');
      return;
    }

    const payload = {
      idDepartemen: matched.idDepartemen,
      bagian: this.formData.bagian,
    };

    if (this.isEditing && this.selectedId !== null) {
      this.bagianDepartemenService.update(this.selectedId, payload).subscribe({
        next: () => {
          this.loadBagianDepartemen();
          this.closeModal();
          this.showToast('Data berhasil diperbarui!', 'success');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Gagal memperbarui bagian departemen:', err);
          this.showToast('Gagal memperbarui data bagian departemen.', 'danger');
        },
      });
    } else {
      this.bagianDepartemenService.create(payload).subscribe({
        next: () => {
          this.loadBagianDepartemen();
          this.closeModal();
          this.showToast('Bagian berhasil ditambahkan!', 'success');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Gagal menambah bagian departemen:', err);
          this.showToast('Gagal menambah data bagian departemen.', 'danger');
        },
      });
    }
  }

  async hapusBagian(item: BagianDepartemen) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Bagian Departemen',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus bagian <strong>${item.bagian}</strong> dari departemen <strong>${item.departemen}</strong>?`),
      cssClass: 'custom-alert-dialog',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.bagianDepartemenService.remove(item.idBagian).subscribe({
              next: () => {
                this.showToast('Bagian departemen berhasil dihapus!', 'success');
                this.loadBagianDepartemen();
                this.onFilterChange();
              },
              error: (err: HttpErrorResponse) => {
                console.error('Gagal menghapus bagian departemen:', err);
                this.showToast('Gagal menghapus data (kemungkinan masih dipakai data lain).', 'danger');
              },
            });
          }
        }
      ]
    });

    await alertEl.present();
  }

  // ===== SIDEBAR & NAVIGASI =====
  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
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
