jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import axios from 'axios';

import {
  BOOTSTRAP_RELEASE_CACHE_KEY,
  fetchLatestRepoReleaseRef,
  getBootstrapReleaseCache,
  getValidBootstrapResourcesFromCache,
  loadBootstrapResources,
  resetBootstrapResourceLoaderForTests,
  resolveBootstrapResources,
  writeBootstrapReleaseCache,
} from './resourceBootstrap';

describe('resourceBootstrap', () => {
  beforeEach(() => {
    axios.get.mockReset();
    localStorage.clear();
    resetBootstrapResourceLoaderForTests();
  });

  it('reuses a valid bootstrap cache without hitting the network', async () => {
    const now = Date.now();
    const cachedResources = [
      {
        owner: 'unfoldingword',
        name: 'en_ult',
        subject: 'Bible',
        title: 'unfoldingWord Literal Text',
        languageId: 'en',
        ref: 'v1',
        link: 'unfoldingword/en/ult/v1',
      },
    ];

    writeBootstrapReleaseCache(cachedResources, localStorage, now - 1000);

    const resources = await loadBootstrapResources({
      server: 'https://git.door43.org',
      resources: cachedResources,
      now,
    });

    expect(resources).toEqual(cachedResources);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('rejects cache entries older than 24 hours for startup rendering', async () => {
    const now = Date.now();
    const staleResources = [
      {
        owner: 'unfoldingword',
        name: 'en_ult',
        subject: 'Bible',
        title: 'unfoldingWord Literal Text',
        languageId: 'en',
        ref: 'v1',
        link: 'unfoldingword/en/ult/v1',
      },
    ];

    localStorage.setItem(
      BOOTSTRAP_RELEASE_CACHE_KEY,
      JSON.stringify({
        resolvedAt: now - 25 * 60 * 60 * 1000,
        repos: staleResources,
      })
    );
    axios.get.mockResolvedValueOnce({
      data: { tag_name: 'v2' },
    });

    const resources = await loadBootstrapResources({
      server: 'https://git.door43.org',
      resources: staleResources.map(({ ref, link, ...resource }) => resource),
      now,
    });

    expect(resources).toEqual([
      expect.objectContaining({
        name: 'en_ult',
        ref: 'v2',
      }),
    ]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('ignores corrupt cache entries', () => {
    localStorage.setItem(BOOTSTRAP_RELEASE_CACHE_KEY, '{"broken":');

    expect(getBootstrapReleaseCache()).toBeNull();
    expect(getValidBootstrapResourcesFromCache()).toBeNull();
  });

  it('fetches the latest release tag from the preferred latest endpoint', async () => {
    axios.get.mockResolvedValueOnce({
      data: { tag_name: 'v88' },
    });

    const ref = await fetchLatestRepoReleaseRef(
      'https://git.door43.org',
      'unfoldingword',
      'en_ult'
    );

    expect(ref).toBe('v88');
    expect(axios.get).toHaveBeenCalledWith(
      'https://git.door43.org/api/v1/repos/unfoldingword/en_ult/releases/latest'
    );
  });

  it('falls back to the releases list when the latest endpoint is unavailable', async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: [
          { tag_name: 'v1', published_at: '2025-01-01T00:00:00.000Z' },
          { tag_name: 'v2', published_at: '2025-02-01T00:00:00.000Z' },
        ],
      });

    const ref = await fetchLatestRepoReleaseRef(
      'https://git.door43.org',
      'unfoldingword',
      'en_tn'
    );

    expect(ref).toBe('v2');
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://git.door43.org/api/v1/repos/unfoldingword/en_tn/releases'
    );
  });

  it('omits bootstrap repos that cannot resolve a release', async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: [] });

    const resources = await resolveBootstrapResources('https://git.door43.org', [
      {
        owner: 'unfoldingword',
        name: 'missing_repo',
        subject: 'Bible',
        title: 'Missing',
        languageId: 'en',
      },
    ]);

    expect(resources).toEqual([]);
  });

  it('deduplicates concurrent bootstrap resolution work', async () => {
    let resolveLatestRequest;
    axios.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLatestRequest = resolve;
        })
    );

    const resourceSeed = [
      {
        owner: 'unfoldingword',
        name: 'en_ult',
        subject: 'Bible',
        title: 'unfoldingWord Literal Text',
        languageId: 'en',
      },
    ];
    const firstRequest = loadBootstrapResources({
      server: 'https://git.door43.org',
      resources: resourceSeed,
    });
    const secondRequest = loadBootstrapResources({
      server: 'https://git.door43.org',
      resources: resourceSeed,
    });

    resolveLatestRequest({ data: { tag_name: 'v3' } });

    await expect(firstRequest).resolves.toEqual([
      expect.objectContaining({ ref: 'v3' }),
    ]);
    await expect(secondRequest).resolves.toEqual([
      expect.objectContaining({ ref: 'v3' }),
    ]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
