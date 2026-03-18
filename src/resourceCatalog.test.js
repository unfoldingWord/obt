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
  fetchCatalogResources,
  filterResourcesByLanguage,
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

  it('returns tc-ready and core resources for selected languages', async () => {
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

    const resources = await fetchCatalogResources(
      'https://git.door43.org',
      ['en'],
      ['Bible']
    );

    expect(resources).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'en_ult',
        ref: 'v1',
        link: 'unfoldingword/en/ult/v1',
      }),
    ]);
  });

  it('deduplicates in-flight catalog loads for the same language selection', async () => {
    let resolveTcReadyRepos;
    fetchTcReadyRepos.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTcReadyRepos = resolve;
        })
    );

    const firstRequest = loadCatalogResources('https://git.door43.org', ['en'], ['Bible']);
    const secondRequest = loadCatalogResources('https://git.door43.org', ['en'], ['Bible']);

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
    await expect(secondRequest).resolves.toEqual([
      expect.objectContaining({ name: 'en_ult' }),
    ]);
    expect(fetchTcReadyRepos).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
