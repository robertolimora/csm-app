
import { Injectable, signal, computed } from '@angular/core';

export interface RuntimeConfig {
  terminal: {
    id: string;
    name: string;
    unitId: string;
    modules: string[]; // Enum strings
  };
  user: {
    id: string;
    roles: string[];
    permissionVersion: number;
  } | null;
  permissions: string[]; // ['medical.write', 'patient.read']
  features: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  // State Signals
  private _terminal = signal<RuntimeConfig['terminal'] | null>(null);
  private _user = signal<RuntimeConfig['user'] | null>(null);
  private _permissions = signal<Set<string>>(new Set());
  private _config = signal<Record<string, any>>({});

  // Computed
  readonly terminal = this._terminal.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  init(data: RuntimeConfig) {
    this._terminal.set(data.terminal);
    this._user.set(data.user);
    this._permissions.set(new Set(data.permissions));
    this._config.set(data.features);
    
    // Initialize WebSocket connection here
    this.connectSocket();
  }

  hasPermission(permission: string): boolean {
    return this._permissions().has(permission);
  }

  isModuleAllowed(moduleName: string): boolean {
    return this._terminal()?.modules.includes(moduleName) ?? false;
  }

  private connectSocket() {
    // Socket.io connection logic using terminalId and unitId from signal
  }
}
