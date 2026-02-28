import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FadeCarosel } from './fade-carosel';

describe('FadeCarosel', () => {
  let component: FadeCarosel;
  let fixture: ComponentFixture<FadeCarosel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FadeCarosel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FadeCarosel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
