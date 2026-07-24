import { TestBed } from '@angular/core/testing';

import { OrderFilter } from '../../models/order-service.models';
import { OrderFilterComponent } from './order-filter.component';

describe('OrderFilterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFilterComponent],
    }).compileComponents();
  });

  it('emits the asset code entered in the plate filter', () => {
    const fixture = TestBed.createComponent(OrderFilterComponent);
    const component = fixture.componentInstance;
    let submitted: OrderFilter | undefined;
    component.search.subscribe((filter) => {
      submitted = filter;
    });

    component.referenceData = {
      initialFilter: {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        branch: '0101',
        status: '',
        order: '',
        plate: '',
      },
      branches: [{ label: 'Matriz', value: '0101' }],
      statuses: [{ label: 'Todas', value: '' }],
    };
    component.form.controls.plate.setValue('SYD4C58');

    component.submit();

    expect(submitted?.plate).toBe('SYD4C58');
  });

  it('opens the STJ lookup with branch and period', () => {
    const fixture = TestBed.createComponent(OrderFilterComponent);
    const component = fixture.componentInstance;
    let lookupType = '';
    let lookupFilter = '';
    component.openLookup.subscribe((request) => {
      lookupType = request.type;
      lookupFilter = request.filter;
    });

    component.referenceData = {
      initialFilter: {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        branch: '0101',
        status: '',
        order: '',
        plate: '',
      },
      branches: [{ label: 'Matriz', value: '0101' }],
      statuses: [{ label: 'Todas', value: '' }],
    };

    component.openOrderLookup();

    expect(lookupType).toBe('TJ_ORDEM');
    expect(lookupFilter).toBe('0101;2026-07-01;2026-07-31');
  });

  it('clears optional filters and searches the default context again', () => {
    const fixture = TestBed.createComponent(OrderFilterComponent);
    const component = fixture.componentInstance;
    let submitted: OrderFilter | undefined;
    component.search.subscribe((filter) => {
      submitted = filter;
    });
    component.referenceData = {
      initialFilter: {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        branch: '0101',
        status: '',
        order: '',
        plate: '',
      },
      branches: [{ label: 'Matriz', value: '0101' }],
      statuses: [{ label: 'Todas', value: '' }],
    };
    component.form.patchValue({ status: 'L', order: '171886', plate: 'SYD4C58' });

    component.clear();

    expect(submitted).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      branch: '0101',
      status: '',
      order: '',
      plate: '',
    });
  });
});
