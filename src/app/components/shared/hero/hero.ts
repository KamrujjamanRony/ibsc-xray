import { Component, inject, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { environment } from '../../../../environments/environment';
import { AboutM } from '../../../utils/models';
import { AboutS } from '../../../services/about-s';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  companyName = environment.companyName;
  aboutService = inject(AboutS);
  about = signal<AboutM>({} as AboutM);

  ngOnInit() {
    this.aboutService.get(environment.companyCode).subscribe(data => data && this.about.set(data));
  }

}
