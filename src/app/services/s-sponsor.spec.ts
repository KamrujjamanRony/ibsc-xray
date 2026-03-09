import { TestBed } from '@angular/core/testing';

import { SSponsor } from './s-sponsor';

describe('SSponsor', () => {
  let service: SSponsor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SSponsor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
