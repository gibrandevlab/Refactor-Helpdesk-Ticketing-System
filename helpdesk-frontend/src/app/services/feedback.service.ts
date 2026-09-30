import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeedbackReport {
  idTicket: string;
  reportedBy: string;
  tanggal: string;
  feedback: string;
  keterangan: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl, { headers: this.getHeaders() });
  }

  getMyTickets(): Observable<any> {
    return this.http.get(`${this.baseUrl}/my-tickets`, { headers: this.getHeaders() });
  }

  getMyFeedbacks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/my-feedbacks`, { headers: this.getHeaders() });
  }

  submitFeedback(data: { id_ticket: string; rating: number; feedback: string; keterangan: string }): Observable<any> {
    return this.http.post(this.baseUrl, data, { headers: this.getHeaders() });
  }
}
