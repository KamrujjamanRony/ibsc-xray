import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappBtn } from './whatsapp-btn';

describe('WhatsappBtn', () => {
  let component: WhatsappBtn;
  let fixture: ComponentFixture<WhatsappBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
