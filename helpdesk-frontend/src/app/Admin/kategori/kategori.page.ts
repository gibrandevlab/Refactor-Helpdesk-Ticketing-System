import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
  pricetagsOutline,
  closeOutline,
  saveOutline,
} from 'ionicons/icons';
import { Kategori, KategoriService } from '../../services/kategori.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-kategori',
  templateUrl: './kategori.page.html',
  styleUrls: ['./kategori.page.scss'],
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
export class KategoriPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'kategori';

  kategoriList: Kategori[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  formData: any = {
    nama_kategori: '',
  };

  constructor(
    private router: Router,
    private kategoriService: KategoriService,
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
      pricetagsOutline,
      closeOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.loadKategori();
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

  loadKategori() {
    this.kategoriService.getAll().subscribe({
      next: (res: Kategori[]) => {
        this.kategoriList = res;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Gagal memuat data kategori:', err);
        this.showToast('Gagal memuat data kategori dari server.', 'danger');
      },
    });
  }

  get filteredKategori(): Kategori[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.kategoriList;
    return this.kategoriList.filter(
      (k) => k.nama && k.nama.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredKategori.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedKategori(): Kategori[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredKategori.slice(start, start + this.pageSize);
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
    this.formData = { nama_kategori: '' };
    this.isModalOpen = true;
  }

  openEditModal(k: Kategori) {
    this.isEditing = true;
    this.selectedId = k.id;
    this.formData = { nama_kategori: k.nama };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  simpanKategori() {
    const namaVal = this.formData.nama_kategori?.trim();
    if (!namaVal) {
      this.showToast('Nama kategori wajib diisi!', 'warning');
      return;
    }

    if (this.isEditing && this.selectedId !== null) {
      this.kategoriService.update(this.selectedId, namaVal).subscribe({
        next: () => {
          this.showToast('Data kategori berhasil diperbarui!', 'success');
          this.closeModal();
          this.loadKategori();
        },
        error: (err: HttpErrorResponse) =>
          this.showToast('Gagal memperbarui: ' + (err.error?.message || err.message), 'danger'),
      });
    } else {
      this.kategoriService.create(namaVal).subscribe({
        next: () => {
          this.showToast('Kategori berhasil ditambahkan!', 'success');
          this.closeModal();
          this.loadKategori();
        },
        error: (err: HttpErrorResponse) =>
          this.showToast('Gagal menambah kategori: ' + (err.error?.message || err.message), 'danger'),
      });
    }
  }

  async hapusKategori(k: Kategori) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Kategori',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus kategori <strong>"${k.nama}"</strong>?`),
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.kategoriService.remove(k.id).subscribe({
              next: () => {
                this.showToast('Kategori berhasil dihapus!', 'success');
                this.loadKategori();
              },
              error: (err: HttpErrorResponse) =>
                this.showToast('Gagal menghapus: ' + (err.error?.message || err.message), 'danger'),
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

  goToDashboard() {
    this.setActiveMenu('dashboard');
    this.router.navigate(['/dashboard']);
  }
  goToListTicket() {
    this.setActiveMenu('list-ticket');
    this.router.navigate(['/list']);
  }
  goToApprovalTicket() {
    this.setActiveMenu('approval-ticket');
    this.router.navigate(['/approval']);
  }
  goToAssignmentTicket() {
    this.setActiveMenu('assignment-ticket');
    this.router.navigate(['/assignment']);
  }
  goToKaryawan() {
    this.setActiveMenu('karyawan');
    this.router.navigate(['/karyawan']);
  }
  goToUser() {
    this.setActiveMenu('user');
    this.router.navigate(['/users']);
  }
  goToJabatan() {
    this.setActiveMenu('jabatan');
    this.router.navigate(['/jabatan']);
  }
  goToDepartemen() {
    this.setActiveMenu('departemen');
    this.router.navigate(['/departemen']);
  }
  goToBagianDepartemen() {
    this.setActiveMenu('bagian-departemen');
    this.router.navigate(['/bagian-departemen']);
  }
  goToKategori() {
    this.setActiveMenu('kategori');
    this.router.navigate(['/kategori']);
  }
  goToSubKategori() {
    this.setActiveMenu('sub-kategori');
    this.router.navigate(['/sub-kategori']);
  }
  goToTeknisi() {
    this.setActiveMenu('teknisi');
    this.router.navigate(['/teknisi']);
  }
  goToInventory() {
    this.setActiveMenu('inventory');
    this.router.navigate(['/inventory']);
  }
  goToSchedule() {
    this.setActiveMenu('schedule');
    this.router.navigate(['/schedule']);
  }
  goToLaporanFeedback() {
    this.setActiveMenu('laporan-feedback');
    this.router.navigate(['/laporan-feedback']);
  }
  goToStatistikTicket() {
    this.setActiveMenu('statistik-ticket');
    this.router.navigate(['/statistik-ticket']);
  }
  goToProfile() {
    this.setActiveMenu('profile');
    this.router.navigate(['/profile']);
  }
  goToNotifikasi() {
    this.setActiveMenu('notifikasi');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
