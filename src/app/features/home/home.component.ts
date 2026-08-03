import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeBannerComponent } from './components/home-banner/home-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeBannerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent { }
