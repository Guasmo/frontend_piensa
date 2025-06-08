import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPanel } from './select-panel';

describe('SelectPanel', () => {
  let component: SelectPanel;
  let fixture: ComponentFixture<SelectPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
