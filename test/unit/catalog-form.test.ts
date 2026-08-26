import { describe, expect, it } from 'vitest';
import {
  catalogCommissionValueInputProps,
  catalogPercentInputProps,
} from '../../app/utils/catalog-form';

describe('catalogPercentInputProps', () => {
  it('allows hundredths of a percent without snapping to 1%', () => {
    expect(catalogPercentInputProps.step).toBe(0.0001);
    expect(catalogPercentInputProps.stepSnapping).toBe(false);
  });
});

describe('catalogCommissionValueInputProps', () => {
  it('uses percent precision when commission type is PERCENTAGE', () => {
    const props = catalogCommissionValueInputProps('PERCENTAGE');
    expect(props.step).toBe(0.0001);
    expect(props.stepSnapping).toBe(false);
    expect(props.formatOptions?.style).toBe('percent');
  });
});
