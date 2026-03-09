import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraImageList } from './extra-image-list';

describe('ExtraImageList', () => {
  let component: ExtraImageList;
  let fixture: ComponentFixture<ExtraImageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraImageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraImageList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
