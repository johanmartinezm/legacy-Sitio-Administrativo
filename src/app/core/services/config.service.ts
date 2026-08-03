import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private config: any;

    constructor(private http: HttpClient) { }

    /**
     * Carga la configuración desde el archivo JSON externo.
     * Se ejecuta antes de que arranque la aplicación (APP_INITIALIZER).
     */
    loadConfig(): Promise<any> {
        return firstValueFrom(
            this.http.get('./assets/config/config.json')
        ).then(data => {
            this.config = data;
            console.log('External config loaded:', this.config);
        }).catch(err => {
            console.error('Could not load external config, using fallback', err);
            // Fallback en caso de error
            this.config = { apiUrl: 'http://localhost:8080' };
        });
    }

    get apiUrl(): string {
        return this.config ? this.config.apiUrl : 'http://localhost:8080';
    }

    get isProduction(): boolean {
        return this.config ? this.config.production : false;
    }
}
