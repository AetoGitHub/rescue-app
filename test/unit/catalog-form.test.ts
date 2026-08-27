import { describe, expect, it } from 'vitest';
import {
  apiFractionToPercentString,
  catalogCommissionValueInputProps,
  catalogPercentInputProps,
  parsePercentInput,
  percentStringToApiFraction,
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

describe('percentStringToApiFraction', () => {
  it('converts 70 and 70% to 0.7', () => {
    expect(percentStringToApiFraction('70')).toBe('0.7');
    expect(percentStringToApiFraction('70%')).toBe('0.7');
    expect(percentStringToApiFraction('70.00')).toBe('0.7');
  });

  it('keeps hundredths of a percent', () => {
    expect(percentStringToApiFraction('12.5')).toBe('0.125');
    expect(percentStringToApiFraction('1.80')).toBe('0.018');
  });

  it('parsePercentInput accepts a trailing percent sign', () => {
    expect(parsePercentInput('70%')).toBe(70);
    expect(parsePercentInput('70')).toBe(70);
  });
});

describe('apiFractionToPercentString', () => {
  it('converts API fraction 0.7 to form percent 70.00', () => {
    expect(apiFractionToPercentString('0.7')).toBe('70.00');
    expect(apiFractionToPercentString('0.70')).toBe('70.00');
  });

  it('leaves legacy whole percents unchanged', () => {
    expect(apiFractionToPercentString('70')).toBe('70.00');
    expect(apiFractionToPercentString('20.00')).toBe('20.00');
  });
});
