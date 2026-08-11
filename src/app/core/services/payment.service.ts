import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface PaymentIntentRequest {
  reference_type: string;
  reference_id: string;
  amount: number;
  return_url: string;
}

export interface PaymentIntentResponse {
  form_url: string;
}

export interface PaymentVerifyResponse {
  status: string;
  tx_id: string;
  credibanco_order_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  // La URL se resuelve en tiempo de ejecucion, igual que en el resto de
  // servicios. Este era el unico que importaba environment.apiUrl, fijo en
  // http://localhost:8080 al compilar: en produccion el panel llamaba al equipo
  // de quien lo abriera, asi que los pagos no funcionaban desde el servidor.
  private get apiUrl(): string {
    return `${this.config.apiUrl}/api/payments`;
  }

  createPaymentIntent(req: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.apiUrl}/intent`, req);
  }

  verifyPayment(orderId: string): Observable<PaymentVerifyResponse> {
    return this.http.get<PaymentVerifyResponse>(`${this.apiUrl}/verify?tx_id=${orderId}`);
  }
}
