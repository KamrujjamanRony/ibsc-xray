import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsWrapper } from './products-wrapper';

describe('ProductsWrapper', () => {
  let component: ProductsWrapper;
  let fixture: ComponentFixture<ProductsWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsWrapper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
