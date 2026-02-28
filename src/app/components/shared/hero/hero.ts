import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  companyName = environment.companyName;

}
