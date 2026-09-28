import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export interface Schedule {
  id: number;
  id_schedule?: number;
  nama: string;
  nama_schedule?: string;
  id_departemen: number;
  id_kategori: number;
  id_sub_kategori: number | null;
  frekuensi: number;
  satuan: 'hari' | 'minggu' | 'bulan' | 'tahun';
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  id_teknis?: string[];
  teknisi_list?: string;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  nama_kategori?: string;
  next_maintenance?: string;
  total_aset?: number;
  progress?: number;
  status_pengerjaan?: string;
  completed_aset?: number;
  progress_dates?: string[];
  max_progress?: number;
}

export interface DepartmentSchedule {
  id_departemen: number;
  nama_departemen: string;
  schedules: Schedule[];
  total_aktif: number;
}

export interface AvailableSchedule {
  id_schedule: number;
  nama_schedule: string;
  deskripsi?: string;
  departemen: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_aset: number;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/schedule`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken() || ''}`);
  }

  private buildHttpParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    for (const key of Object.keys(params)) {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val);
      }
    }
    return httpParams;
  }

  getDepartmentsWithSchedules(): Observable<DepartmentSchedule[]> {
    return this.http.get<DepartmentSchedule[]>(`${this.apiUrl}/departments`, {
      headers: this.getHeaders(),
    });
  }

  getSchedulesByDepartment(deptId: number): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/department/${deptId}`, {
      headers: this.getHeaders(),
    });
  }

  getAssetsBySchedule(scheduleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${scheduleId}/assets`, {
      headers: this.getHeaders(),
    });
  }

  checkTeknisiAvailability(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/check-teknisi`, {
      headers: this.getHeaders(),
      params: this.buildHttpParams(params),
    });
  }

  getAvailableTeknisi(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/available-teknisi`, {
      headers: this.getHeaders(),
      params: this.buildHttpParams(params),
    });
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers: this.getHeaders() });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  toggleActive(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  getAvailable(): Observable<AvailableSchedule[]> {
    return this.http.get<AvailableSchedule[]>(`${this.apiUrl}/available`, {
      headers: this.getHeaders(),
    });
  }

  claim(scheduleId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${scheduleId}/claim`, {}, {
      headers: this.getHeaders(),
    });
  }

  unclaim(scheduleId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${scheduleId}/unclaim`, {}, {
      headers: this.getHeaders(),
    });
  }

  // Klaim SATU asset spesifik dalam schedule
  claimAsset(scheduleId: number, kodeAsset: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${scheduleId}/claim-asset`,
      { kode_asset: kodeAsset },
      { headers: this.getHeaders() }
    );
  }
}
