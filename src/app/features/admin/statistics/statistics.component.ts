import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StatsService, DashboardStats } from '../../../core/services/admin/stats/stats.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatIconModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule
    ],
    templateUrl: './statistics.component.html',
    styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit, AfterViewInit {
    @ViewChild('trendChart') trendChartCanvas!: ElementRef<HTMLCanvasElement>;

    stats: DashboardStats | null = null;
    chart: Chart | null = null;
    selectedPeriod: 'weekly' | 'monthly' | 'yearly' = 'monthly';

    displayedArticleColumns: string[] = ['index', 'title', 'views'];
    displayedUserColumns: string[] = ['index', 'name', 'reads'];

    constructor(private statsService: StatsService) { }

    ngOnInit(): void {
        this.loadStats();
    }

    ngAfterViewInit(): void {
        // Chart will be initialized after data loads
    }

    loadStats(): void {
        this.statsService.getDashboardStats().subscribe({
            next: (data) => {
                this.stats = data;
                setTimeout(() => this.updateChart(), 100);
            },
            error: (err) => console.error('Error loading stats', err)
        });
    }

    onPeriodChange(period: any): void {
        this.selectedPeriod = period.value;
        this.updateChart();
    }

    updateChart(): void {
        if (!this.trendChartCanvas || !this.stats) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        let periodData: any[] = [];
        if (this.selectedPeriod === 'weekly') periodData = this.stats.weekly_stats;
        else if (this.selectedPeriod === 'monthly') periodData = this.stats.monthly_stats;
        else periodData = this.stats.yearly_stats;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: periodData.map(d => d.period),
                datasets: [{
                    label: 'Lecturas',
                    data: periodData.map(d => d.views),
                    borderColor: '#1E2F4D',
                    backgroundColor: 'rgba(30, 47, 77, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#C5A059',
                    pointBorderColor: '#fff',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    getTotalViews(): number {
        if (!this.stats) return 0;
        return this.stats.monthly_stats.reduce((acc, curr) => acc + curr.views, 0);
    }

    getBestSeller(): string {
        if (!this.stats || this.stats.top_articles.length === 0) return 'N/A';
        return this.stats.top_articles[0].title;
    }
}
