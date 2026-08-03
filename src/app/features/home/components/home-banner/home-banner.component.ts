import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BannerSlide {
    image: string;
    title: string;
    subtitle: string;
    link: string;
}

@Component({
    selector: 'app-home-banner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './home-banner.component.html',
    styleUrls: ['./home-banner.component.scss']
})
export class HomeBannerComponent implements OnInit, OnDestroy {
    slides: BannerSlide[] = [
        {
            image: 'assets/images/banner-placeholder.jpg', // Placeholder, will style with fallback
            title: 'Eventos Summit 2026 FAMILIA',
            subtitle: 'Conecta, Aprende y Crece con tu Familia Empresaria',
            link: '/events/summit-2026'
        },
        // Add more slides here if needed
        {
            image: '',
            title: 'Descubre nuestros programas',
            subtitle: 'Formación para el éxito',
            link: '/programs'
        }
    ];

    currentSlide = 0;
    private intervalId: any;

    ngOnInit() {
        this.startAutoSlide();
    }

    ngOnDestroy() {
        this.stopAutoSlide();
    }

    startAutoSlide() {
        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    stopAutoSlide() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    }

    goToSlide(index: number) {
        this.currentSlide = index;
        // Reset timer on manual interaction
        this.stopAutoSlide();
        this.startAutoSlide();
    }

    onBannerClick() {
        console.log('Banner clicked:', this.slides[this.currentSlide]);
        // Implement navigation logic here
        // this.router.navigate([this.slides[this.currentSlide].link]);
    }
}
