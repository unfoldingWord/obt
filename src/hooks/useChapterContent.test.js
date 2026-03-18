import React from 'react';
import { renderHook } from '@testing-library/react';

import { ResourcesContext } from '@texttree/scripture-resources-rcl';

import useChapterContent from './useChapterContent';

const createWrapper = (value) =>
  function ResourcesWrapper({ children }) {
    return (
      <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>
    );
  };

describe('useChapterContent', () => {
  it('returns provider-backed chapter content for the matching bible resource', () => {
    const wrapper = createWrapper({
      state: {
        resources: [
          {
            username: 'unfoldingword',
            languageId: 'en',
            resourceId: 'ult',
            tag: 'v88',
            projectId: 'mat',
            resourceLink: 'unfoldingword/en/ult/v88/mat',
          },
        ],
        books: [
          {
            json: {
              chapters: {
                1: {
                  1: { verseObjects: [{ text: 'The book' }] },
                },
              },
            },
          },
        ],
      },
    });

    const { result } = renderHook(
      () =>
        useChapterContent({
          reference: { bookId: 'mat', chapter: 1, verse: 1 },
          resource: {
            owner: 'unfoldingword',
            languageId: 'en',
            name: 'en_ult',
            ref: 'v88',
          },
        }),
      { wrapper }
    );

    expect(result.current.resource.resourceLink).toBe('unfoldingword/en/ult/v88/mat');
    expect(result.current.chapterData).toEqual({
      1: { verseObjects: [{ text: 'The book' }] },
    });
    expect(result.current.resourceStatus).toEqual({
      loading: false,
      contentNotFoundError: false,
      error: false,
    });
  });

  it('stays loading until provider books are available', () => {
    const wrapper = createWrapper({
      state: {
        resources: [
          {
            username: 'unfoldingword',
            languageId: 'en',
            resourceId: 'ust',
            tag: 'v88',
            projectId: 'mat',
            resourceLink: 'unfoldingword/en/ust/v88/mat',
          },
        ],
        books: undefined,
      },
    });

    const { result } = renderHook(
      () =>
        useChapterContent({
          reference: { bookId: 'mat', chapter: 1, verse: 1 },
          resource: {
            owner: 'unfoldingword',
            languageId: 'en',
            name: 'en_ust',
            ref: 'v88',
          },
        }),
      { wrapper }
    );

    expect(result.current.resourceStatus.loading).toBe(true);
    expect(result.current.chapterData).toBeNull();
  });
});
