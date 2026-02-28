import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, input, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faPlus, faGlobe, faClock, faCalendarAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-fade-carosel',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './fade-carosel.html',
  styleUrl: './fade-carosel.css',
})
export class FadeCarosel {
  slides = input<any[]>([]);
  @Input() delay = 2500;   // autoplay delay
  @Input() speed = 700;    // fade animation
  faPlay = faPlay;
  faPlus = faPlus;
  faGlobe = faGlobe;
  faClock = faClock;
  faCalendarAlt = faCalendarAlt;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  current = 0;
  interval: any;
  ImageApi = '/img/';

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.startAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();

    this.interval = setInterval(() => {
      this.next();
      this.cdr.detectChanges(); // forces Angular update
    }, this.delay);
  }

  stopAutoplay() {
    if (this.interval) clearInterval(this.interval);
  }

  next() {
    this.current = (this.current + 1) % this.slides().length;
  }

  prev() {
    this.current = (this.current - 1 + this.slides().length) % this.slides().length;
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

}
