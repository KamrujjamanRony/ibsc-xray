import { Component } from '@angular/core';
import { Sidebar } from "../../components/shared/sidebar/sidebar";
import { RouterOutlet } from "@angular/router";
import { Breadcrumb } from "../../utils/breadcrumb/breadcrumb";

@Component({
  selector: 'app-admin',
  imports: [Sidebar, RouterOutlet, Breadcrumb],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {

}
