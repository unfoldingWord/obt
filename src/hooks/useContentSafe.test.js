import { renderHook } from '@testing-library/react';

import useContentSafe from './useContentSafe';

const mockUseRsrc = jest.fn();
const mockUseTsvItems = jest.fn();
const mockUseExtraContentSafe = jest.fn();

jest.mock('scripture-resources-rcl', () => ({
  useRsrc: (...args) => mockUseRsrc(...args),
}));

jest.mock('translation-helps-rcl/dist/hooks/useTsvItems', () => {
  return (...args) => mockUseTsvItems(...args);
});

jest.mock('./useExtraContentSafe', () => {
  return (...args) => mockUseExtraContentSafe(...args);
});

describe('useContentSafe', () => {
  beforeEach(() => {
    mockUseRsrc.mockReturnValue({
      state: {
        content: 'content',
        resource: { manifest: {} },
        loadingResource: false,
        loadingContent: false,
        fetchResponse: null,
      },
      actions: {
        reloadResource: jest.fn(),
      },
    });
    mockUseTsvItems.mockReturnValue({
      items: [],
      tsvs: [],
      loading: false,
    });
    mockUseExtraContentSafe.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses listRef as the default contentRef', () => {
    renderHook(() =>
      useContentSafe({
        listRef: 'v88',
        owner: 'unfoldingword',
        server: 'https://example.org',
        projectId: 'mat',
        languageId: 'en',
        resourceId: 'ult',
      })
    );

    expect(mockUseTsvItems).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: 'v88',
      })
    );
  });
});
