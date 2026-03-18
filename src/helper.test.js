jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import axios from 'axios';

import { fetchTcReadyRepos, getRepoSlug, getDefaultBibleLayout } from './helper';

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

describe('getDefaultBibleLayout', () => {
  it('builds the 5-resource default layout when literal/simplified/tn/twl/ta exist', () => {
    const resourcesApp = [
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_ult',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_ust',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_tn',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_twl',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_ta',
      },
    ];

    const layout = getDefaultBibleLayout('en', resourcesApp);
    const ids = layout.lg.map((item) => item.i);

    expect(ids).toEqual([
      'unfoldingword__en_ult',
      'unfoldingword__en_ust',
      'unfoldingword__en_twl',
      'unfoldingword__en_tn',
      'unfoldingword__en_ta',
    ]);

    expect(layout.lg[0]).toMatchObject({ w: 4, h: 12, x: 0, y: 0 });
    expect(layout.lg[1]).toMatchObject({ w: 4, h: 6, x: 4, y: 0 });
    expect(layout.lg[2]).toMatchObject({ w: 4, h: 6, x: 4, y: 6 });
    expect(layout.lg[3]).toMatchObject({ w: 4, h: 6, x: 8, y: 0 });
    expect(layout.lg[4]).toMatchObject({ w: 4, h: 6, x: 8, y: 6 });
    expect(layout.md).toHaveLength(5);
    expect(layout.sm).toHaveLength(5);
  });

  it('uses available core resources when some default resources are missing', () => {
    const resourcesApp = [
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_ult',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_ust',
      },
    ];

    const layout = getDefaultBibleLayout('en', resourcesApp);
    expect(layout.lg).toEqual([
      expect.objectContaining({
        i: 'unfoldingword__en_ult',
        w: 4,
        h: 12,
        x: 0,
        y: 0,
      }),
      expect.objectContaining({
        i: 'unfoldingword__en_ust',
        w: 4,
        h: 12,
        x: 4,
        y: 0,
      }),
    ]);
    expect(layout.md).toHaveLength(2);
    expect(layout.sm).toHaveLength(2);
  });

  it('prefers unfoldingword resources over lower-priority owners', () => {
    const resourcesApp = [
      {
        languageId: 'en',
        owner: 'door43-catalog',
        name: 'en_twl',
      },
      {
        languageId: 'en',
        owner: 'unfoldingword',
        name: 'en_twl',
      },
    ];

    const layout = getDefaultBibleLayout('en', resourcesApp);
    expect(layout.lg).toEqual([
      expect.objectContaining({
        i: 'unfoldingword__en_twl',
      }),
    ]);
  });
});
