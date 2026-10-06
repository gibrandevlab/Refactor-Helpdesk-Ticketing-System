import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { FeedbackService } from '../../services/feedback.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-laporan-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SidebarComponent,
    RouterLink,
  ],
})
export class LaporanFeedbackPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isSidebarOpen = false;

  // ===== DATA & STATE =====
  rawFeedbackList: any[] = [];
  selectedTeknisi: any = null; // Jika null -> Tampil Card Utama. Jika terisi -> Tampil Detail Feedback

  // Data terolah
  allTeknisiSummaryList: any[] = [];
  filteredTeknisiList: any[] = [];
  pagedTeknisiList: any[] = [];

  filteredFeedbackDetail: any[] = [];
  pagedFeedback: any[] = [];

  // ===== MODAL DETAIL FEEDBACK =====
  isDetailOpen = false;
  selectedFeedback: any = null;

  // ===== FILTER & SEARCH =====
  searchTeknisi = ''; // Pencarian di Tampilan 1 (Grid Card Teknisi)
  searchDetail = '';  // Pencarian di Tampilan 2 (Tabel Detail Feedback)
  filterRating = '';
  ratingOptions: string[] = ['Positif', 'Negatif'];

  // ===== PAGINATION GRID TEKNISI =====
  teknisiCurrentPage = 1;
  teknisiPageSize = 12;
  teknisiTotalPages = 1;
  visibleTeknisiPages: number[] = [];

  // ===== PAGINATION DETAIL FEEDBACK (15 ROW) =====
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;
  visibleDetailPages: number[] = [];

  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadFeedback();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeedback() {
    this.feedbackService.getAll().pipe(
      take(1),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        const rawData = res.data || res;
        if (Array.isArray(rawData)) {
          this.rawFeedbackList = rawData.map((item: any) => ({
            idTicket: item.id_ticket,
            reportedBy: item.reported || item.nik_pelapor || '-',
            idTeknisi: item.id_teknisi || '-',
            namaTeknisi: item.nama_teknisi || 'Belum Ditentukan / Tanpa Teknisi',
            tanggal: item.tanggal,
            rating: Number(item.rating) || 5,
            feedback: item.feedback,
            keterangan: item.keterangan || '-',
          }));

          this.processTeknisiSummary();
        }
      },
      error: (err) => {
        console.error('Gagal mengambil data dari database:', err);
      },
    });
  }

  // ===== HITUNG REKAP CARD TEKNISI =====
  processTeknisiSummary() {
    const term = this.searchTeknisi.trim().toLowerCase();
    const groups: { [key: string]: any } = {};

    for (let i = 0; i < this.rawFeedbackList.length; i++) {
      const f = this.rawFeedbackList[i];
      const key = f.idTeknisi !== '-' ? f.idTeknisi : 'unassigned';
      if (!groups[key]) {
        groups[key] = {
          idTeknisi: f.idTeknisi,
          namaTeknisi: f.namaTeknisi,
          items: []
        };
      }
      groups[key].items.push(f);
    }

    this.allTeknisiSummaryList = Object.values(groups).map((group: any) => {
      const totalRating = group.items.reduce((sum: number, item: any) => sum + item.rating, 0);
      const avg = group.items.length > 0 ? totalRating / group.items.length : 0;
      return {
        ...group,
        totalFeedback: group.items.length,
        averageRating: Number(avg.toFixed(1))
      };
    });

    if (term) {
      this.filteredTeknisiList = this.allTeknisiSummaryList.filter((t: any) =>
        t.namaTeknisi.toLowerCase().includes(term) ||
        t.idTeknisi.toLowerCase().includes(term)
      );
    } else {
      this.filteredTeknisiList = [...this.allTeknisiSummaryList];
    }

    this.teknisiCurrentPage = 1;
    this.updateTeknisiPagination();
  }

  updateTeknisiPagination() {
    this.teknisiTotalPages = Math.max(1, Math.ceil(this.filteredTeknisiList.length / this.teknisiPageSize));
    this.visibleTeknisiPages = this.getVisiblePages(this.teknisiCurrentPage, this.teknisiTotalPages);

    const start = (this.teknisiCurrentPage - 1) * this.teknisiPageSize;
    this.pagedTeknisiList = this.filteredTeknisiList.slice(start, start + this.teknisiPageSize);
  }

  onSearchTeknisiChange() {
    this.processTeknisiSummary();
  }

  goToTeknisiPage(page: number) {
    if (page >= 1 && page <= this.teknisiTotalPages) {
      this.teknisiCurrentPage = page;
      this.updateTeknisiPagination();
    }
  }

  // ===== NAVIGASI DETAIL TEKNISI =====
  selectTeknisi(teknisi: any) {
    this.selectedTeknisi = teknisi;
    this.searchDetail = '';
    this.filterRating = '';
    this.currentPage = 1;
    this.processDetailFilter();
  }

  backToTeknisiList() {
    this.selectedTeknisi = null;
    this.searchTeknisi = '';
    this.searchDetail = '';
    this.filterRating = '';
    this.processTeknisiSummary();
  }

  // ===== FILTER & PAGINATION HALAMAN DETAIL =====
  processDetailFilter() {
    if (!this.selectedTeknisi) {
      this.filteredFeedbackDetail = [];
      this.pagedFeedback = [];
      return;
    }

    const term = this.searchDetail.trim().toLowerCase();

    this.filteredFeedbackDetail = this.selectedTeknisi.items.filter((f: any) => {
      const matchSearch =
        !term ||
        f.idTicket.toLowerCase().includes(term) ||
        f.reportedBy.toLowerCase().includes(term) ||
        f.keterangan.toLowerCase().includes(term);

      const matchRating =
        !this.filterRating ||
        String(f.feedback).toLowerCase() === this.filterRating.toLowerCase();

      return matchSearch && matchRating;
    });

    this.totalPages = Math.max(1, Math.ceil(this.filteredFeedbackDetail.length / this.pageSize));
    this.visibleDetailPages = this.getVisiblePages(this.currentPage, this.totalPages);

    this.updatePagedFeedback();
  }

  updatePagedFeedback() {
    this.visibleDetailPages = this.getVisiblePages(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedFeedback = this.filteredFeedbackDetail.slice(start, start + this.pageSize);
  }

  onFilterDetailChange() {
    this.currentPage = 1;
    this.processDetailFilter();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedFeedback();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedFeedback();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedFeedback();
    }
  }

  // Helper untuk membuat daftar halaman ter-paginasi secara dinamis (maksimal 5 angka tampil)
  private getVisiblePages(current: number, total: number): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // TrackBy functions untuk optimasi performa rendering DOM
  trackByTeknisi(index: number, item: any): string {
    return item.idTeknisi;
  }

  trackByTicket(index: number, item: any): string {
    return item.idTicket;
  }

  // ===== POP-UP DETAIL FEEDBACK ITEM =====
  openDetail(item: any) {
    this.selectedFeedback = item;
    this.isDetailOpen = true;
  }

  closeDetail() {
    this.isDetailOpen = false;
    this.selectedFeedback = null;
  }

  getRatingClass(rating: string): string {
    const val = String(rating || '').toLowerCase();
    if (val === 'positif') return 'feedback-positif';
    if (val === 'negatif') return 'feedback-negatif';
    return 'feedback-default';
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
