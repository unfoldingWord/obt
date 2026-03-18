import { core as scriptureResourcesCore } from 'scripture-resources-rcl';

import {
  getLatestReleasedRef,
  loadGlAlignmentBible,
  loadGlAlignmentBibles,
} from './glAlignment';
import {
  fetchLatestRepoReleaseRef,
  getValidBootstrapResourcesFromCache,
} from './resourceBootstrap';

jest.mock('scripture-resources-rcl', () => ({
  core: {
    resourceFromResourceLink: jest.fn(),
  },
}));

jest.mock('./resourceBootstrap', () => ({
  fetchLatestRepoReleaseRef: jest.fn(),
  getValidBootstrapResourcesFromCache: jest.fn(),
}));

describe('glAlignment', () => {
  beforeEach(() => {
    fetchLatestRepoReleaseRef.mockReset();
    getValidBootstrapResourcesFromCache.mockReset();
    scriptureResourcesCore.resourceFromResourceLink.mockReset();
  });

  it('reuses bootstrap cache refs when available', async () => {
    getValidBootstrapResourcesFromCache.mockReturnValue([
      {
        owner: 'unfoldingword',
        name: 'en_ult',
        ref: 'v88',
      },
    ]);

    const ref = await getLatestReleasedRef({
      server: 'https://git.door43.org',
      owner: 'unfoldingword',
      repo: 'en_ult',
    });

    expect(ref).toBe('v88');
    expect(fetchLatestRepoReleaseRef).not.toHaveBeenCalled();
  });

  it('falls back to latest release lookup when bootstrap cache misses', async () => {
    getValidBootstrapResourcesFromCache.mockReturnValue(null);
    fetchLatestRepoReleaseRef.mockResolvedValue('v89');

    const ref = await getLatestReleasedRef({
      server: 'https://git.door43.org',
      owner: 'unfoldingword',
      repo: 'en_ust',
    });

    expect(ref).toBe('v89');
    expect(fetchLatestRepoReleaseRef).toHaveBeenCalledWith(
      'https://git.door43.org',
      'unfoldingword',
      'en_ust'
    );
  });

  it('loads GL bibles from the resolved release ref', async () => {
    getValidBootstrapResourcesFromCache.mockReturnValue([
      {
        owner: 'unfoldingword',
        name: 'en_ult',
        ref: 'v88',
      },
    ]);
    scriptureResourcesCore.resourceFromResourceLink.mockResolvedValue({
      manifest: {},
      project: {
        parseUsfm: jest.fn().mockResolvedValue({ json: { chapters: {} } }),
      },
    });

    const bible = await loadGlAlignmentBible({
      owner: 'unfoldingword',
      glBible: 'en_ult',
      server: 'https://git.door43.org',
      reference: {
        bookId: 'mat',
        chapter: '1',
        verse: '1',
      },
    });

    expect(scriptureResourcesCore.resourceFromResourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceLink: 'unfoldingword/en/ult/v88',
        reference: { bookId: 'mat' },
      })
    );
    expect(bible?.json).toEqual({ chapters: {} });
  });

  it('filters out GL bible load failures', async () => {
    getValidBootstrapResourcesFromCache.mockReturnValue(null);
    fetchLatestRepoReleaseRef.mockResolvedValue('v88');
    scriptureResourcesCore.resourceFromResourceLink
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        manifest: {},
        project: {
          parseUsfm: jest.fn().mockResolvedValue({ json: { chapters: {} } }),
        },
      });

    const bibles = await loadGlAlignmentBibles({
      owner: 'unfoldingword',
      glBibleList: ['en_ult', 'en_ust'],
      server: 'https://git.door43.org',
      reference: { bookId: 'mat' },
    });

    expect(bibles).toHaveLength(1);
    expect(scriptureResourcesCore.resourceFromResourceLink).toHaveBeenCalledTimes(2);
  });
});
