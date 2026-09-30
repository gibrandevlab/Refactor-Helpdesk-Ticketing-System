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

  // Data terolah (disimpan di variabel biasa agar tidak nge-freeze karena Change Detection)
  teknisiSummaryList: any[] = [];
  filteredFeedbackDetail: any[] = [];
  pagedFeedback: any[] = [];

  // ===== MODAL DETAIL FEEDBACK =====
  isDetailOpen = false;
  selectedFeedback: any = null;

  // ===== FILTER & SEARCH (DIPISAH) =====
  searchTeknisi = ''; // Pencarian di Tampilan 1 (Grid Card Teknisi)
  searchDetail = '';  // Pencarian di Tampilan 2 (Tabel Detail Feedback)
  filterRating = '';
  ratingOptions: string[] = ['Positif', 'Negatif'];

  // Pagination untuk tabel detail feedback (15 row per halaman)
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;
  totalPagesArray: number[] = [];

  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadFeedback();
  }

  ngOnDestroy() {
    // Membebaskan memori saat halaman dihancurkan / pindah route
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

          // Process rekap data awal
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

    this.rawFeedbackList.forEach((f) => {
      const key = f.idTeknisi !== '-' ? f.idTeknisi : 'unassigned';
      if (!groups[key]) {
        groups[key] = {
          idTeknisi: f.idTeknisi,
          namaTeknisi: f.namaTeknisi,
          items: []
        };
      }
      groups[key].items.push(f);
    });

    let list = Object.values(groups).map((group: any) => {
      const totalRating = group.items.reduce((sum: number, item: any) => sum + item.rating, 0);
      const avg = group.items.length > 0 ? totalRating / group.items.length : 0;
      return {
        ...group,
        totalFeedback: group.items.length,
        averageRating: Number(avg.toFixed(1))
      };
    });

    if (term) {
      list = list.filter((t: any) =>
        t.namaTeknisi.toLowerCase().includes(term) ||
        t.idTeknisi.toLowerCase().includes(term)
      );
    }

    this.teknisiSummaryList = list;
  }

  onSearchTeknisiChange() {
    this.processTeknisiSummary();
  }

  // ===== NAVIGASI BUKA/TUTUP DETAIL TEKNISI =====
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

    // 🔥 FIX: Konversi kedua nilai ke lowercase agar tidak bermasalah karena huruf kapital
    const matchRating =
      !this.filterRating ||
      String(f.feedback).toLowerCase() === this.filterRating.toLowerCase();

    return matchSearch && matchRating;
  });

  // Recalculate Pagination
  this.totalPages = Math.max(1, Math.ceil(this.filteredFeedbackDetail.length / this.pageSize));
  this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  this.updatePagedFeedback();
}

  updatePagedFeedback() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedFeedback = this.filteredFeedbackDetail.slice(start, start + this.pageSize);
  }

  onFilterDetailChange() {
    this.currentPage = 1;
    this.processDetailFilter();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagedFeedback();
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
