import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../services/dashboard.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface Activity {
  icon: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  text: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    SidebarComponent,
    RouterLink
  ],
  providers: [DashboardService]
})
export class DashboardPage implements OnInit, AfterViewInit {
  @ViewChild('ticketChart') ticketChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('feedbackChart') feedbackChartRef!: ElementRef<HTMLCanvasElement>;

  isSidebarOpen = false;
  isLoading = true;

  user = {
    nama: 'Admin',
    role: 'admin',
  };

  pendingCount = 0;

  // Data Statistik Ticket & Users
  totalTicket = 0;
  totalTicketTrend = 0;

  waitingApproval = 0;
  waitingApprovalTrend = 0;

  onProgress = 0;
  onProgressTrend = 0;

  closedTicket = 0;
  closedTicketTrend = 0;

  totalUser = 0;
  totalTeknisi = 0;
  totalAsset = 0;

  // Data Statistik Feedback & Rating (Diambil dari v_dashboard_summary)
  totalFeedback = 0;
  rataRataRating = 0;
  feedbackPositif = 0;
  feedbackNegatif = 0;
  feedbackPositifPercent = 0;
  feedbackNegatifPercent = 0;
  feedbackPositifTrend = 0;

  // Data Grafik
  chartLabels: string[] = [];
  chartTotal: number[] = [];
  chartClosed: number[] = [];
  chartOnProgress: number[] = [];
  chartWaitingApproval: number[] = [];

  // Data Aktivitas
  activities: Activity[] = [];

  private lineChart?: Chart;
  private donutChart?: Chart;

  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {}
// AMBIL DATA DARI BACKEND
  loadDashboardData() {
    this.isLoading = true;
    this.dashboardService.getAdminDashboard().subscribe({
      next: (res: any) => {
        const data = res.data;

        // 1. Mapping Data Statistik Ticket & Users (dengan fallback nama variabel)
        const summary = data.summary || {};
        this.totalTicket = summary.total_tiket || 0;
        this.waitingApproval = summary.waiting_approval ?? summary.tiket_menunggu_approval ?? summary.menunggu_approval ?? 0;
        this.onProgress = summary.on_process ?? summary.tiket_on_process ?? 0;
        this.closedTicket = summary.solved ?? summary.tiket_solved ?? 0;
        this.totalUser = summary.total_user ?? summary.total_user_aktif ?? summary.total_karyawan ?? 0;
        this.totalTeknisi = summary.total_teknisi ?? summary.total_teknisi_aktif ?? 0;
        this.totalAsset = summary.total_asset ?? summary.total_inventory ?? 0;
        this.pendingCount = this.waitingApproval;

        // 2. Mapping Data Feedback & Rating
        this.totalFeedback = summary.total_feedback || 0;
        this.feedbackPositif = summary.feedback_positif || 0;
        this.feedbackNegatif = summary.feedback_negatif || 0;
        this.rataRataRating = summary.rata_rata_rating ? parseFloat(summary.rata_rata_rating) : 0;

        // Hitung persentase dinamis
        if (this.totalFeedback > 0) {
          this.feedbackPositifPercent = Math.round((this.feedbackPositif / this.totalFeedback) * 100);
          this.feedbackNegatifPercent = Math.round((this.feedbackNegatif / this.totalFeedback) * 100);
        } else {
          this.feedbackPositifPercent = 0;
          this.feedbackNegatifPercent = 0;
        }

        // 3. Mapping Data Grafik Bulanan
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const currentYear = new Date().getFullYear();

        let totals = Array(12).fill(0);
        let closed = Array(12).fill(0);
        let progress = Array(12).fill(0);
        let waiting = Array(12).fill(0);

        const tiketBulanan = data.tiketBulanan || [];
        tiketBulanan.forEach((item: any) => {
          const [year, month] = item.bulan.split('-');
          if (parseInt(year) === currentYear) {
            const index = parseInt(month) - 1;
            totals[index] = item.jumlah || 0;
            closed[index] = Math.floor(item.jumlah * 0.7) || 0;
            progress[index] = Math.floor(item.jumlah * 0.2) || 0;
            waiting[index] = Math.floor(item.jumlah * 0.1) || 0;
          }
        });

        this.chartLabels = months;
        this.chartTotal = totals;
        this.chartClosed = closed;
        this.chartOnProgress = progress;
        this.chartWaitingApproval = waiting;

        // 4. Mapping Aktivitas Terbaru
        const aktivitas = data.aktivitasTerbaru || [];
        this.activities = aktivitas.map((item: any) => ({
          icon: this.getActivityIcon(item.status),
          type: this.getActivityType(item.status),
          text: `${item.reported || 'User'} ${this.getActivityText(item.status)}`,
          time: this.formatWaktuRelatif(item.tanggal_lapor)
        }));

        this.isLoading = false;

        // Render Grafik
        setTimeout(() => {
          this.renderTicketChart();
          this.renderFeedbackChart();
        }, 100);
      },
      error: (err: any) => {
        console.error('Gagal memuat dashboard', err);
        this.isLoading = false;
      }
    });
  }

  // HELPER UNTUK AKTIVITAS
  getActivityIcon(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('solved') || s.includes('selesai')) return 'checkmark-circle-outline';
    if (s.includes('approve')) return 'checkmark-done-outline';
    if (s.includes('process') || s.includes('proses')) return 'construct-outline';
    if (s.includes('menunggu')) return 'hourglass-outline';
    return 'add-circle-outline';
  }

  getActivityType(status: string): 'info' | 'success' | 'warning' | 'danger' {
    const s = (status || '').toLowerCase();
    if (s.includes('solved') || s.includes('selesai')) return 'success';
    if (s.includes('process') || s.includes('proses')) return 'warning';
    if (s.includes('reject')) return 'danger';
    return 'info';
  }

  getActivityText(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('solved') || s.includes('selesai')) return 'menyelesaikan ticket';
    if (s.includes('approve')) return 'menyetujui ticket';
    if (s.includes('process') || s.includes('proses')) return 'memproses ticket';
    if (s.includes('menunggu')) return 'mengirim ticket baru';
    return 'melakukan aktivitas';
  }

  formatWaktuRelatif(dateStr: string): string {
    if (!dateStr) return '-';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} hari lalu`;
    if (diffHours > 0) return `${diffHours} jam lalu`;
    return 'Baru saja';
  }

  // CHART RENDER
  private renderTicketChart() {
    if (!this.ticketChartRef) return;
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    this.lineChart = new Chart(this.ticketChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [
          { label: 'Total', data: this.chartTotal, borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
          { label: 'Closed', data: this.chartClosed, borderColor: '#22c55e', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
          { label: 'On Progress', data: this.chartOnProgress, borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
          { label: 'Waiting Approval', data: this.chartWaitingApproval, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderFeedbackChart() {
    if (!this.feedbackChartRef) return;
    if (this.donutChart) {
      this.donutChart.destroy();
    }

    // Menggunakan data riil persentase feedback
    const hasData = this.totalFeedback > 0;
    const chartData = hasData ? [this.feedbackPositifPercent, this.feedbackNegatifPercent] : [100, 0];
    const chartColors = hasData ? ['#22c55e', '#ef4444'] : ['#e2e8f0', '#cbd5e1'];

    this.donutChart = new Chart(this.feedbackChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Positif', 'Negatif'],
        datasets: [{ data: chartData, backgroundColor: chartColors, borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false } },
      },
    });
  }

  // EVENT HANDLER
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  getPageSubtitle(): string {
    return `Selamat datang kembali, ${this.user.nama} `;
  }
}
