import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // Chỉ import RouterOutlet
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Toast, Footer], // Không được có RouterModule.forRoot() ở đây
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'book-shop-frontend';
}