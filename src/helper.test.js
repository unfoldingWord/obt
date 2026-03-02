jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import axios from 'axios';

import { fetchTcReadyRepos, getRepoSlug } from './helper';

describe('getRepoSlug', () => {
  it('normalizes mixed-case owner and repo names', () => {
    expect(getRepoSlug('Door43', 'BHP')).toBe('door43/bhp');
  });

  it('handles missing values safely', () => {
    expect(getRepoSlug(undefined, null)).toBe('/');
  });
});

describe('fetchTcReadyRepos', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('paginates tc-ready repo search at 25 repos per page', async () => {
    const firstPage = Array.from({ length: 25 }, (_, index) => ({
      owner: { username: `Owner-${index}` },
      name: `Repo-${index}`,
    }));
    const secondPage = [{ owner: { login: 'Door43-Catalog' }, name: 'en_tn' }];

    axios.get
      .mockResolvedValueOnce({ data: { data: firstPage } })
      .mockResolvedValueOnce({ data: { data: secondPage } });

    const tcReadyRepos = await fetchTcReadyRepos('https://git.door43.org');

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://git.door43.org/api/v1/repos/search',
      {
        params: {
          topic: 'tc-ready',
          limit: 25,
          page: 1,
        },
      }
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://git.door43.org/api/v1/repos/search',
      {
        params: {
          topic: 'tc-ready',
          limit: 25,
          page: 2,
        },
      }
    );
    expect(tcReadyRepos.has('owner-0/repo-0')).toBe(true);
    expect(tcReadyRepos.has('door43-catalog/en_tn')).toBe(true);
  });

  it('supports alternate owner fields and omits invalid slugs', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          { owner: { name: 'AltOwner' }, name: 'ValidRepo' },
          { owner: {}, name: null },
        ],
      },
    });

    const tcReadyRepos = await fetchTcReadyRepos('https://git.door43.org');

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(tcReadyRepos.has('altowner/validrepo')).toBe(true);
    expect(tcReadyRepos.has('/')).toBe(false);
  });
});
