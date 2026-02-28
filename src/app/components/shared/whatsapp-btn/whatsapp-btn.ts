import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-whatsapp-btn',
  imports: [FontAwesomeModule],
  templateUrl: './whatsapp-btn.html',
  styleUrl: './whatsapp-btn.css',
})
export class WhatsappBtn {
  faWhatsapp = faWhatsapp;
  whatsappLink = 'https://wa.me/' + environment.whatsappNumber;
}
