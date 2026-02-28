import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAccessTreeComponent } from './user-access-tree.component';

describe('UserAccessTreeComponent', () => {
  let component: UserAccessTreeComponent;
  let fixture: ComponentFixture<UserAccessTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAccessTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAccessTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
