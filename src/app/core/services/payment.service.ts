import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) { }

  createPaymentIntent(req: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${environment.apiUrl}/api/payments/intent`, req);
  }

  verifyPayment(orderId: string): Observable<PaymentVerifyResponse> {
    return this.http.get<PaymentVerifyResponse>(`${environment.apiUrl}/api/payments/verify?tx_id=${orderId}`);
  }
}
