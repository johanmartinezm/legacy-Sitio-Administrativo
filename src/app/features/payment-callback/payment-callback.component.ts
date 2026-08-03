import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage = '';
  orderId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.orderId = params['order_id'];
      if (this.orderId) {
        this.verifyPayment(this.orderId);
      } else {
        this.isLoading = false;
        this.errorMessage = 'No se encontró el ID de orden.';
      }
    });
  }

  verifyPayment(orderId: string) {
    this.paymentService.verifyPayment(orderId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 'APPROVED') {
          this.isSuccess = true;
        } else {
          this.isSuccess = false;
          this.errorMessage = `El pago se encuentra en estado: ${res.status}`;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.errorMessage = 'Ocurrió un error al verificar el pago con CredibanCo.';
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/enroll-users']);
  }
}
