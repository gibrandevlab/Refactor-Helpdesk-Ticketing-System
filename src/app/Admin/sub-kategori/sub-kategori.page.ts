import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonModal,
  IonButtons,
  IonInput,
  ToastController,
  AlertController,
  IonicSafeString,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  addOutline,
  createOutline,
  trashOutline,
  chevronBackOutline,
  chevronForwardOutline,
  pricetagOutline,
  closeOutline,
  saveOutline,
} from 'ionicons/icons';
import { SubKategoriService, SubKategoriRow } from '../../services/sub-kategori.service';
import { Kategori } from '../../services/kategori.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-sub-kategori',
  templateUrl: './sub-kategori.page.html',
  styleUrls: ['./sub-kategori.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonModal,
    IonButtons,
    IonInput,
    SidebarComponent,
  ],
})
export class SubKategoriPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'sub-kategori';

  subKategoriList: SubKategoriRow[] = [];
  kategoriOptions: Kategori[] = [];
  isLoading = false;
  loadError = '';

  searchTerm = '';

  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  isSaving = false;
  formData: { idKategori: number | null; namaSubKategori: string } = {
    idKategori: null,
    namaSubKategori: '',
  };

  constructor(
    private router: Router,
    private subKategoriService: SubKategoriService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline,
      addOutline,
      createOutline,
      trashOutline,
      chevronBackOutline,
      chevronForwardOutline,
      pricetagOutline,
      closeOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.loadSubKategori();
    this.subKategoriService.getKategoriOptions().subscribe({
      next: (data: Kategori[]) => (this.kategoriOptions = data),
      error: (err: any) => console.error('Gagal mengambil daftar kategori untuk dropdown', err),
    });
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }

  loadSubKategori() {
    this.isLoading = true;
    this.loadError = '';
    this.subKategoriService.getAll().subscribe({
      next: (data: SubKategoriRow[]) => {
        this.subKategoriList = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Gagal mengambil data sub kategori', err);
        this.loadError = err?.error?.message || 'Gagal memuat data sub kategori, coba lagi.';
        this.isLoading = false;
        this.showToast(this.loadError, 'danger');
      },
    });
  }

  get filteredSubKategori(): SubKategoriRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.subKategoriList;
    return this.subKategoriList.filter(
      (s) =>
        s.kategori.toLowerCase().includes(term) ||
        s.namaSubKategori.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSubKategori.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedSubKategori(): SubKategoriRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSubKategori.slice(start, start + this.pageSize);
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.formData = { idKategori: null, namaSubKategori: '' };
    this.isModalOpen = true;
  }

  openEditModal(item: SubKategoriRow) {
    this.isEditing = true;
    this.selectedId = item.id;
    this.formData = { idKategori: item.idKategori, namaSubKategori: item.namaSubKategori };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  simpanSubKategori() {
    if (!this.formData.idKategori || !this.formData.namaSubKategori?.trim()) {
      this.showToast('Kategori dan Nama Sub Kategori wajib diisi!', 'warning');
      return;
    }

    this.isSaving = true;

    if (this.isEditing && this.selectedId !== null) {
      this.subKategoriService
        .update(this.selectedId, this.formData.idKategori, this.formData.namaSubKategori)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.closeModal();
            this.loadSubKategori();
            this.showToast('Data sub kategori berhasil diperbarui!', 'success');
          },
          error: (err: any) => {
            this.isSaving = false;
            this.showToast(err?.error?.message || 'Gagal memperbarui sub kategori', 'danger');
          },
        });
    } else {
      this.subKategoriService.create(this.formData.idKategori, this.formData.namaSubKategori).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.loadSubKategori();
          this.showToast('Sub kategori berhasil ditambahkan!', 'success');
        },
        error: (err: any) => {
          this.isSaving = false;
          this.showToast(err?.error?.message || 'Gagal menambah sub kategori', 'danger');
        },
      });
    }
  }

  async hapusSubKategori(item: SubKategoriRow) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Sub Kategori',
      message: new IonicSafeString(
        `Apakah Anda yakin ingin menghapus sub kategori <strong>"${item.namaSubKategori}"</strong> dari kategori <strong>"${item.kategori}"</strong>?`
      ),
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.subKategoriService.remove(item.id).subscribe({
              next: () => {
                this.showToast('Sub kategori berhasil dihapus!', 'success');
                this.loadSubKategori();
                this.onFilterChange();
              },
              error: (err: any) => {
                this.showToast(
                  err?.error?.message || 'Gagal menghapus sub kategori (kemungkinan masih dipakai di tiket)',
                  'danger'
                );
              },
            });
          },
        },
      ],
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
