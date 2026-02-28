import { Component, input } from '@angular/core';

@Component({
  selector: 'app-all-svg',
  standalone: true,
  imports: [],
  templateUrl: './all-svg.component.html',
  styleUrl: './all-svg.component.css'
})
export class AllSvgComponent {
  readonly icon = input<any>();

}
