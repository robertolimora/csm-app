
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from './core/session.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="h-screen flex flex-col bg-gray-50">
      <!-- Top Bar -->
      <header class="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">MedCore</h1>
          @if (session.terminal(); as term) {
            <span class="px-2 py-1 bg-blue-700 rounded text-sm">
              {{ term.name }} ({{ term.unitId }})
            </span>
          }
        </div>
        
        <div class="flex items-center gap-4">
          @if (session.user(); as user) {
            <span>{{ user.id }}</span>
          } @else {
            <span class="italic text-gray-300">Terminal Access Only</span>
          }
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        @if (isLoading) {
          <div class="flex justify-center items-center h-full">
            <span class="text-blue-600">Initializing System...</span>
          </div>
        } @else {
          <router-outlet></router-outlet>
        }
      </main>
    </div>
  `,
  styles: []
})
export class AppComponent {
  session = inject(SessionService);
  isLoading = false; // Controlled by router events or bootstrap status
}
