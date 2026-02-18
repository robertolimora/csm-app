import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BootstrapService {
  private http = inject(HttpClient);

  loadRuntime(): Observable<any> {
    // In production, this hits the API. 
    // For now, we return a mock if API fails or for dev.
    return this.http.get('/api/runtime/setup').pipe(
      tap(config => console.log('Runtime config loaded:', config)),
      catchError(() => {
        console.warn('API unreachable, using fallback config');
        return of({
          terminal: {
            id: 'term-offline',
            name: 'Offline Terminal',
            unitId: 'unit-offline',
            modules: []
          },
          user: null,
          permissions: [],
          features: {}
        });
      })
    );
  }
}