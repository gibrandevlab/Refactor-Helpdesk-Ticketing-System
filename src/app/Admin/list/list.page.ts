import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  cloudUploadOutline,
  closeCircleOutline,
  saveOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  timerOutline,
  menuOutline,
  refreshOutline,
  cubeOutline,
  searchOutline,
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { TicketService, TicketApiRow } from '../../services/ticket.service';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { KategoriService } from '../../services/kategori.service';
import { SubKategoriService } from '../../services/sub-kategori.service';
import { DepartemenService } from '../../services/departemen.services';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface ListTicket {
  id_ticket: string;
  reported: string;
  dept: string;
  tanggal: string;
  formattedTanggal?: string;
  nama_kategori: string;
  nama_sub_kategori: string;
  aset: string;
  lampiran: string;
  lampiranUrl?: string;
  teknisi: string;
  status: string;
  statusClass?: string;
  deskripsi?: string;
  prioritas?: 'Low' | 'Normal' | 'Urgent';
  deadline?: string | null;
  statusPengerjaan?: string | null;
  countdownText?: string;
  isLate?: boolean;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class ListTicketPage implements OnInit, OnDestroy {
  isSidebarOpen = false;
  activeMenu = 'list-ticket';

  tickets: ListTicket[] = [];
  inventoryList: InventoryItem[] = [];
  isLoading = false;

  searchTerm = '';
  filterStatus = '';
  filterDepartemen = '';
  filterKategori = '';
  statusOptions: string[] = [];
  departemenOptions: string[] = [];
  kategoriOptions: string[] = [];

  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: string | null = null;
  selectedFile: File | null = null;

  formData: any = {
    id_departemen: '',
    id_kategori: '',
    id_sub_kategori: '',
    kode_asset: '',
    deskripsi: '',
  };

  departemenOptionsForModal: any[] = [];
  kategoriOptionsForModal: any[] = [];
  subKategoriOptionsForModal: any[] = [];
  filteredSubKategoriOptions: any[] = [];
  filteredAssetOptions: any[] = [];

  private countdownInterval: any;

  // ================= CHART STATISTIK TICKET =================
  filterTahun: number | null = null;
  selectedBulan: number | null = null;
  selectedDeptChart: string = '';
  filterStatusChart: string = '';

  readonly namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  readonly statusGroups = [
    { key: 'approval', label: 'Menunggu Approval' },
    { key: 'assigned', label: 'Assignment Ticket' },
    { key: 'belum_proses', label: 'Belum Diproses Teknisi' },
    { key: 'progress', label: 'Sedang Dikerjakan' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'rejected', label: 'Ditolak' },
  ];

  // 🚀 STATE VARIABLES (Pengganti Getter untuk Mencegah CPU Spike)
  chartBaseTickets: ListTicket[] = [];
  chartBulan: { bulan: number; label: string; jumlah: number }[] = [];
  chartDepartemen: { departemen: string; jumlah: number }[] = [];
  chartAssets: { aset: string; jumlah: number; tickets: ListTicket[] }[] = [];
  filteredTickets: ListTicket[] = [];
  pagedTickets: ListTicket[] = [];
  totalPages = 1;
  totalPagesArray: number[] = [];
  totalTicketChart = 0;
  maxBulanValue = 1;
  maxDeptValue = 1;
  statusCounts: { [key: string]: number } = {};

  constructor(
    private router: Router,
    private ticketService: TicketService,
    private inventoryService: InventoryService,
    private kategoriService: KategoriService,
    private subKategoriService: SubKategoriService,
    private departemenService: DepartemenService,
    private toastCtrl: ToastController,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      closeOutline,
      cloudUploadOutline,
      closeCircleOutline,
      saveOutline,
      eyeOutline,
      createOutline,
      trashOutline,
      timerOutline,
      menuOutline,
      refreshOutline,
      cubeOutline,
      searchOutline,
      addOutline,
      chevronBackOutline,
      chevronForwardOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadTickets();
    this.loadInventory();
    this.loadMasterDataModal();
  }

  ionViewDidEnter() {
    this.startTimer();
  }

  ionViewWillLeave() {
    this.stopTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private stopTimer() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  formatDate(rawDate: string | null | undefined): string {
    if (!rawDate) return '-';
    const d = this.parseTanggal(rawDate);
    if (!d) return rawDate;

    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace('.', ':');
  }

  startTimer() {
    this.stopTimer();
    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        let updated = false;
        for (const t of this.tickets) {
          if (t.deadline && t.status !== 'Solved') {
            this.updateTicketCountdown(t);
            updated = true;
          }
        }
        if (updated) {
          this.cdr.detectChanges();
        }
      }, 1000);
    });
  }

  private updateTicketCountdown(t: ListTicket) {
    if (!t.deadline) {
      t.countdownText = '-';
      t.isLate = false;
      return;
    }
    const now = new Date().getTime();
    const target = new Date(t.deadline).getTime();
    const diff = target - now;

    if (diff <= 0) {
      t.countdownText = '⚠️ TELAT';
      t.isLate = true;
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    t.countdownText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    t.isLate = false;
  }

  getLampiranUrl(lampiranPath: string): string {
    if (!lampiranPath) return '';
    if (lampiranPath.startsWith('http')) {
      return lampiranPath;
    }
    const baseUrl = 'http://localhost:5000';
    let cleanPath = lampiranPath.replace(/^\/?uploads\/?/, '');
    cleanPath = cleanPath.replace(/^\/?lampiran\/?/, '');
    return `${baseUrl}/uploads/${cleanPath}`;
  }

  loadTickets() {
    this.isLoading = true;
    this.ticketService.getAllRaw().subscribe({
      next: (data: TicketApiRow[]) => {
        this.tickets = data.map(item => {
          const t: ListTicket = {
            id_ticket: item.id_ticket,
            reported: item.reported,
            dept: item.dept,
            tanggal: item.tanggal,
            formattedTanggal: this.formatDate(item.tanggal),
            nama_kategori: item.nama_kategori,
            nama_sub_kategori: item.nama_sub_kategori || '',
            aset: item.aset || '',
            lampiran: item.lampiran || '',
            lampiranUrl: this.getLampiranUrl(item.lampiran || ''),
            teknisi: item.teknisi || '',
            status: item.status,
            statusClass: this.getStatusClass(item.status),
            deskripsi: '',
            prioritas: item.prioritas || 'Normal',
            deadline: item.deadline || null,
            statusPengerjaan: item.status_pengerjaan || null,
          };
          this.updateTicketCountdown(t);
          return t;
        });

        this.buildFilterOptions();

        if (this.filterTahun === null) {
          this.filterTahun = this.tahunOptions[0] ?? new Date().getFullYear();
        }

        this.recalculateFilteredData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        if (err.status === 403 || err.status === 401) {
          this.showToast('Akses ditolak. Pastikan Anda login sebagai Admin.', 'danger');
        }
      }
    });
  }

  loadInventory() {
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.inventoryList = data;
        this.filteredAssetOptions = data;
      },
      error: (err) => console.error('Gagal load inventory', err)
    });
  }

  loadMasterDataModal() {
    this.kategoriService.getAll().subscribe({
      next: (res: any) => {
        this.kategoriOptionsForModal = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal load kategori modal', err)
    });

    this.subKategoriService.getAll().subscribe({
      next: (res: any) => {
        this.subKategoriOptionsForModal = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal load sub kategori modal', err)
    });

    this.departemenService.getAll().subscribe({
      next: (res: any) => {
        this.departemenOptionsForModal = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal load departemen modal', err)
    });
  }

  onKategoriChange() {
    const selectedKatId = Number(this.formData.id_kategori);
    this.filteredSubKategoriOptions = this.subKategoriOptionsForModal.filter(
      (sub: any) => Number(sub.idKategori ?? sub.id_kategori) === selectedKatId
    );
    this.formData.id_sub_kategori = '';
  }

  onDepartemenChange() {
    const selectedDeptId = Number(this.formData.id_departemen);
    this.filteredAssetOptions = this.inventoryList.filter((ast: any) => {
      return !selectedDeptId || Number(ast.id_departemen) === selectedDeptId;
    });
  }

  private buildFilterOptions() {
    this.statusOptions = [...new Set(this.tickets.map((t) => t.status).filter(Boolean))];
    this.departemenOptions = [...new Set(this.tickets.map((t) => t.dept).filter(Boolean))];
    this.kategoriOptions = [...new Set(this.tickets.map((t) => t.nama_kategori).filter(Boolean))];
  }

  private parseTanggal(raw: string | null | undefined): Date | null {
    if (!raw) return null;
    const d = new Date(String(raw).trim().replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }

  getFunnelStage(t: ListTicket): string {
    const statusLower = (t.status || '').toLowerCase();
    const pengerjaanLower = (t.statusPengerjaan || '').toLowerCase();
    const hasTeknisi = !!t.teknisi && t.teknisi.trim() !== '' && t.teknisi !== '-';

    if (statusLower.includes('solved') || statusLower.includes('selesai') || pengerjaanLower === 'selesai') {
      return 'selesai';
    }
    if (statusLower.includes('reject')) {
      return 'rejected';
    }
    if (hasTeknisi && pengerjaanLower === 'proses') {
      return 'progress';
    }
    if (hasTeknisi) {
      return 'belum_proses';
    }
    if (statusLower.includes('assign') || statusLower.includes('approve')) {
      return 'assigned';
    }
    return 'approval';
  }

  matchesStatusGroup(t: ListTicket, key: string): boolean {
    return this.getFunnelStage(t) === key;
  }
 countByStatusGroup(key: string): number {
    return this.statusCounts[key] || 0;
  }
  get tahunOptions(): number[] {
    const set = new Set<number>();
    this.tickets.forEach(t => {
      const d = this.parseTanggal(t.tanggal);
      if (d) set.add(d.getFullYear());
    });
    return [...set].sort((a, b) => b - a);
  }

  // 🚀 KALKULASI DATA TERPUSAT (Hanya Dipanggil Saat Ada Perubahan Filter/Data)
  recalculateFilteredData() {
    // 1. Chart Base
    this.chartBaseTickets = this.tickets.filter(t => {
      const d = this.parseTanggal(t.tanggal);
      if (!d) return false;
      if (this.filterTahun && d.getFullYear() !== this.filterTahun) return false;
      if (this.filterStatusChart && !this.matchesStatusGroup(t, this.filterStatusChart)) return false;
      return true;
    });

    this.totalTicketChart = this.chartBaseTickets.length;

    // 2. Chart Bulan
    const counts = new Array(12).fill(0);
    this.chartBaseTickets.forEach(t => {
      const d = this.parseTanggal(t.tanggal)!;
      counts[d.getMonth()]++;
    });
    this.chartBulan = counts.map((jumlah, bulan) => ({ bulan, label: this.namaBulan[bulan], jumlah }));
    this.maxBulanValue = Math.max(1, ...this.chartBulan.map(b => b.jumlah));

    // 3. Chart Departemen
    if (this.selectedBulan !== null) {
      const mapDept = new Map<string, number>();
      this.chartBaseTickets
        .filter(t => this.parseTanggal(t.tanggal)!.getMonth() === this.selectedBulan)
        .forEach(t => {
          const dept = t.dept || '(Belum Diketahui)';
          mapDept.set(dept, (mapDept.get(dept) || 0) + 1);
        });
      this.chartDepartemen = [...mapDept.entries()]
        .map(([departemen, jumlah]) => ({ departemen, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah);
    } else {
      this.chartDepartemen = [];
    }
    this.maxDeptValue = Math.max(1, ...this.chartDepartemen.map(d => d.jumlah));

    // 4. Chart Assets
    if (this.selectedBulan !== null && this.selectedDeptChart) {
      const mapAsset = new Map<string, ListTicket[]>();
      this.chartBaseTickets
        .filter(t =>
          this.parseTanggal(t.tanggal)!.getMonth() === this.selectedBulan &&
          (t.dept || '(Belum Diketahui)') === this.selectedDeptChart
        )
        .forEach(t => {
          const aset = t.aset || '(Tanpa Asset)';
          if (!mapAsset.has(aset)) mapAsset.set(aset, []);
          mapAsset.get(aset)!.push(t);
        });
      this.chartAssets = [...mapAsset.entries()]
        .map(([aset, tickets]) => ({ aset, jumlah: tickets.length, tickets }))
        .sort((a, b) => b.jumlah - a.jumlah);
    } else {
      this.chartAssets = [];
    }

    // 5. Status Group Counts
    this.statusGroups.forEach(g => {
      this.statusCounts[g.key] = this.tickets.filter(t => {
        const d = this.parseTanggal(t.tanggal);
        if (!d) return false;
        if (this.filterTahun && d.getFullYear() !== this.filterTahun) return false;
        return this.matchesStatusGroup(t, g.key);
      }).length;
    });

    // 6. Filter Table
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTickets = this.tickets.filter((t) => {
      const matchSearch = !term || (t.id_ticket?.toLowerCase().includes(term) || t.reported?.toLowerCase().includes(term));
      const matchStatus = !this.filterStatus || t.status === this.filterStatus;
      const matchDept = !this.filterDepartemen || t.dept === this.filterDepartemen;
      const matchKategori = !this.filterKategori || t.nama_kategori === this.filterKategori;

      const d = this.parseTanggal(t.tanggal);
      const matchTahun = !this.filterTahun || (d ? d.getFullYear() === this.filterTahun : false);
      const matchBulan = this.selectedBulan === null || (d ? d.getMonth() === this.selectedBulan : false);
      const matchDeptChart = !this.selectedDeptChart || (t.dept || '(Belum Diketahui)') === this.selectedDeptChart;
      const matchStatusChart = !this.filterStatusChart || this.matchesStatusGroup(t, this.filterStatusChart);

      return matchSearch && matchStatus && matchDept && matchKategori
        && matchTahun && matchBulan && matchDeptChart && matchStatusChart;
    });

    // 7. Pagination
    this.totalPages = Math.max(1, Math.ceil(this.filteredTickets.length / this.pageSize));
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updatePagedTickets();
  }

  updatePagedTickets() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedTickets = this.filteredTickets.slice(start, start + this.pageSize);
  }

  onTahunChange() {
    this.selectedBulan = null;
    this.selectedDeptChart = '';
    this.onFilterChange();
  }

  selectStatusGroup(key: string) {
    this.filterStatusChart = this.filterStatusChart === key ? '' : key;
    this.selectedDeptChart = '';
    this.onFilterChange();
  }

  selectBulan(bulan: number) {
    this.selectedBulan = this.selectedBulan === bulan ? null : bulan;
    this.selectedDeptChart = '';
    this.onFilterChange();
  }

  selectDeptChart(dept: string) {
    this.selectedDeptChart = this.selectedDeptChart === dept ? '' : dept;
    this.onFilterChange();
    setTimeout(() => {
      document.querySelector('.asset-breakdown')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  resetChartFilter() {
    this.selectedBulan = null;
    this.selectedDeptChart = '';
    this.filterStatusChart = '';
    this.onFilterChange();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.recalculateFilteredData();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagedTickets();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedTickets();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedTickets();
    }
  }

  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.selectedFile = null;
    this.formData = {
      id_departemen: '',
      id_kategori: '',
      id_sub_kategori: '',
      kode_asset: '',
      deskripsi: '',
    };
    this.filteredSubKategoriOptions = [];
    this.filteredAssetOptions = this.inventoryList;
    this.isModalOpen = true;
  }

  openEditModal(ticket: ListTicket) {
    this.isEditing = true;
    this.selectedId = ticket.id_ticket;
    this.selectedFile = null;
    this.formData = { ...ticket };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  simpanTicket() {
    if (!this.formData.id_departemen || !this.formData.id_kategori || !this.formData.deskripsi) {
      this.showToast('Departemen, Kategori, dan Deskripsi wajib diisi!', 'warning');
      return;
    }

    this.ticketService.create(this.formData, this.selectedFile || undefined).subscribe({
      next: () => {
        this.showToast('Tiket berhasil ditambahkan!', 'success');
        this.loadTickets();
        this.loadInventory();
        this.closeModal();
      },
      error: (err) => {
        console.error('Gagal menyimpan tiket:', err);
        this.showToast('Gagal menyimpan tiket: ' + (err.error?.message || err.message), 'danger');
      }
    });
  }

  hapusTicket(ticket: ListTicket) {
    if (confirm(`Apakah Anda yakin ingin menghapus tiket "${ticket.id_ticket}"?`)) {
      this.ticketService.remove(ticket.id_ticket).subscribe({
        next: () => {
          this.showToast('Tiket berhasil dihapus.', 'success');
          this.loadTickets();
        },
        error: (err) => {
          console.error('Gagal menghapus tiket:', err);
          this.showToast(err.error?.message || 'Gagal menghapus tiket.', 'danger');
        }
      });
    }
  }

  downloadChecklistPdf(ticket: ListTicket) {
    this.ticketService.downloadChecklistPdf(ticket.id_ticket);
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-default';
    const s = status.toLowerCase();
    if (s.includes('proses') || s.includes('progress')) return 'status-proses';
    if (s.includes('approve') || s.includes('approval') || s.includes('menunggu')) return 'status-approval';
    if (s.includes('assign')) return 'status-assigned';
    if (s.includes('resolved') || s.includes('closed') || s.includes('selesai')) return 'status-closed';
    if (s.includes('reject') || s.includes('tolak')) return 'status-rejected';
    return 'status-default';
  }

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

  onViewDetail(ticket: ListTicket) { console.log('View detail', ticket.id_ticket); }
  onEditTicket(ticket: ListTicket) { this.openEditModal(ticket); }
  onNewTicket() { this.openTambahModal(); }
}
