import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvailableKaryawan {
  nik: string;
  nama: string;
  departemen: string;
}

@Injectable({ providedIn: 'root' })
export class KaryawanService {
  private apiUrl = `${environment.apiUrl}/karyawan`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token || ''}` });
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  getAvailable(): Observable<AvailableKaryawan[]> {
    return this.http.get<AvailableKaryawan[]>(`${this.apiUrl}/available`, { headers: this.getHeaders() });
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
}
