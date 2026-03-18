jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('./helper', () => {
  const actual = jest.requireActual('./helper');
  return {
    ...actual,
    fetchTcReadyRepos: jest.fn(),
  };
});

import axios from 'axios';

import { fetchTcReadyRepos } from './helper';
import {
  getCatalogLanguageIds,
  filterResourcesByLanguage,
  loadCatalogLanguageIds,
  loadCatalogResources,
  resetCatalogResourceLoaderForTests,
} from './resourceCatalog';

describe('resourceCatalog', () => {
  beforeEach(() => {
    axios.get.mockReset();
    fetchTcReadyRepos.mockReset();
    resetCatalogResourceLoaderForTests();
  });

  it('filters resources to the selected languages', () => {
    expect(
      filterResourcesByLanguage(
        [
          { languageId: 'en', name: 'en_ult' },
          { languageId: 'fr', name: 'fr_ult' },
        ],
        ['en']
      )
    ).toEqual([{ languageId: 'en', name: 'en_ult' }]);
  });

  it('returns only tc-ready resources for selected languages', async () => {
    fetchTcReadyRepos.mockResolvedValueOnce(new Set(['unfoldingword/en_ult']));
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            language: 'en',
            name: 'en_ult',
            subject: 'Bible',
            title: 'ULT',
            branch_or_tag_name: 'v1',
            owner: 'unfoldingword',
            full_name: 'unfoldingword/en_ult',
          },
          {
            id: 2,
            language: 'fr',
            name: 'fr_ult',
            subject: 'Bible',
            title: 'French ULT',
            branch_or_tag_name: 'v1',
            owner: 'door43-catalog',
            full_name: 'door43-catalog/fr_ult',
          },
          {
            id: 3,
            language: 'en',
            name: 'custom_repo',
            subject: 'Bible',
            title: 'Custom',
            branch_or_tag_name: 'v1',
            owner: 'someone',
            full_name: 'someone/custom_repo',
          },
        ],
      },
    });

    const resources = await loadCatalogResources('https://git.door43.org', ['en'], ['Bible']);

    expect(resources).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'en_ult',
        ref: 'v1',
        link: 'unfoldingword/en/ult/v1',
      }),
    ]);
  });

  it('collects unique language ids from the filtered catalog', () => {
    expect(
      getCatalogLanguageIds([
        { languageId: 'en', name: 'en_ult' },
        { languageId: 'fr', name: 'fr_tn' },
        { languageId: 'en', name: 'en_twl' },
      ])
    ).toEqual(['en', 'fr']);
  });

  it('loads available language ids from tc-ready catalog entries only', async () => {
    fetchTcReadyRepos.mockResolvedValueOnce(
      new Set(['unfoldingword/en_ult', 'door43-catalog/fr_tn'])
    );
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            language: 'en',
            name: 'en_ult',
            subject: 'Bible',
            title: 'ULT',
            branch_or_tag_name: 'v1',
            owner: 'unfoldingword',
          },
          {
            id: 2,
            language: 'fr',
            name: 'fr_tn',
            subject: 'TSV Translation Notes',
            title: 'French TN',
            branch_or_tag_name: 'v1',
            owner: 'door43-catalog',
          },
          {
            id: 3,
            language: 'ru',
            name: 'ru_tn',
            subject: 'TSV Translation Notes',
            title: 'Russian TN',
            branch_or_tag_name: 'v1',
            owner: 'ru_gt',
          },
        ],
      },
    });

    await expect(
      loadCatalogLanguageIds('https://git.door43.org', ['Bible'])
    ).resolves.toEqual(['en', 'fr']);
  });

  it('deduplicates in-flight catalog loads across filtered resource and language lookups', async () => {
    let resolveTcReadyRepos;
    fetchTcReadyRepos.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTcReadyRepos = resolve;
        })
    );

    const firstRequest = loadCatalogResources('https://git.door43.org', ['en'], ['Bible']);
    const secondRequest = loadCatalogLanguageIds('https://git.door43.org', ['Bible']);

    resolveTcReadyRepos(new Set(['unfoldingword/en_ult']));
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            language: 'en',
            name: 'en_ult',
            subject: 'Bible',
            title: 'ULT',
            branch_or_tag_name: 'v1',
            owner: 'unfoldingword',
            full_name: 'unfoldingword/en_ult',
          },
        ],
      },
    });

    await expect(firstRequest).resolves.toEqual([
      expect.objectContaining({ name: 'en_ult' }),
    ]);
    await expect(secondRequest).resolves.toEqual(['en']);
    expect(fetchTcReadyRepos).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
