import { Component, input, Input } from '@angular/core';
import { ProductCard } from "../product-card/product-card";
import { ProductM } from '../../../utils/models';
import { PageTitle } from "../page-title/page-title";

@Component({
  selector: 'app-products-wrapper',
  imports: [ProductCard, PageTitle],
  templateUrl: './products-wrapper.html',
  styleUrl: './products-wrapper.css',
})
export class ProductsWrapper {
  title = input<any>("Our Products");
  products = input<ProductM[]>([]);

}
