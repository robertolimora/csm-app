import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="p-8 text-center">
      <h2 class="text-2xl font-bold mb-4">Bem-vindo ao MedCore</h2>
      <p class="text-gray-600">Selecione um módulo no menu para começar.</p>
    </div>
  `
})
export class HomeComponent {}