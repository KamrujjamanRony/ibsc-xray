import { Component } from '@angular/core';
import { Navbar } from "../../components/shared/navbar/navbar";
import { RouterOutlet } from "@angular/router";
import { Footer } from "../../components/shared/footer/footer";
import { WhatsappBtn } from "../../components/shared/whatsapp-btn/whatsapp-btn";

@Component({
  selector: 'app-main',
  imports: [Navbar, RouterOutlet, Footer, WhatsappBtn],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

}
