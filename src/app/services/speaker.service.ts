import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoryItem, HistoryResponse, SpeakersResponse } from '../interfaces/speakerInterface';

// Interfaces para tipar las respuestas

@Injectable({
  providedIn: 'root'
})
export class SpeakersService {
  private baseUrl = 'http://localhost:3000/speakers'; // Ajusta la URL según tu configuración

  constructor(private http: HttpClient) {}

  // Obtener todos los speakers
  getAllSpeakers(): Observable<SpeakersResponse> {
    return this.http.get<SpeakersResponse>(this.baseUrl);
  }

  // Obtener un speaker por ID
  getSpeaker(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // Obtener historial de un speaker específico
  getSpeakerHistory(
    speakerId: number, 
    limit: number = 10, 
    page: number = 1
  ): Observable<HistoryResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    return this.http.get<HistoryResponse>(`${this.baseUrl}/${speakerId}/history`, { params });
  }

  // Obtener historial de todos los speakers (puedes llamar a cada uno individualmente)
  getAllSpeakersHistory(): Observable<HistoryItem[]> {
    return new Observable(observer => {
      this.getAllSpeakers().subscribe({
        next: (speakersResponse) => {
          const allHistories: HistoryItem[] = [];
          let completedRequests = 0;
          const totalSpeakers = speakersResponse.data.length;

          if (totalSpeakers === 0) {
            observer.next([]);
            observer.complete();
            return;
          }

          speakersResponse.data.forEach(speaker => {
            this.getSpeakerHistory(speaker.id, 50, 1).subscribe({
              next: (historyResponse) => {
                allHistories.push(...historyResponse.data.histories);
                completedRequests++;
                
                if (completedRequests === totalSpeakers) {
                  // Ordenar por fecha más reciente
                  allHistories.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                  observer.next(allHistories);
                  observer.complete();
                }
              },
              error: (error) => {
                console.error(`Error fetching history for speaker ${speaker.id}:`, error);
                completedRequests++;
                
                if (completedRequests === totalSpeakers) {
                  observer.next(allHistories);
                  observer.complete();
                }
              }
            });
          });
        },
        error: (error) => {
          console.error('Error fetching speakers:', error);
          observer.error(error);
        }
      });
    });
  }
}