import { Injectable } from '@angular/core';
import { Timetable } from './timetable.service';
import { Observable, take } from 'rxjs';
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment.development';

export interface DatabaseReturn {
  error: boolean; message: string; data: any
}

@Injectable({
  providedIn: 'root'
})

export class DatabaseService {

  constructor(
    private http: HttpClient
  ) { }

  processTimetable(timetable: Timetable): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/process/timetable`, { timetable }).pipe(take(1));
  }

  retrieveSelectedTimetable(code: string, selectionId: number): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/process/selectSavedItem`, { code, selectionId }).pipe(take(1));
  }
}
