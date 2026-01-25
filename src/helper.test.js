jest.mock('axios', () => ({
  __esModule: true,
  default: {},
}));

import { getRepoSlug } from './helper';

describe('getRepoSlug', () => {
  it('normalizes mixed-case owner and repo names', () => {
    expect(getRepoSlug('Door43', 'BHP')).toBe('door43/bhp');
  });

  it('handles missing values safely', () => {
    expect(getRepoSlug(undefined, null)).toBe('/');
  });
});
