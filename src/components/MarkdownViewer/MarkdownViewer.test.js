import React from 'react';

import { render, screen } from '@testing-library/react';

jest.mock('../../context', () => {
  const React = require('react');

  return {
    ReferenceContext: React.createContext({
      state: {},
      actions: {
        goToBookChapterVerse: jest.fn(),
      },
    }),
  };
});

jest.mock('react-markdown', () => {
  const React = require('react');

  return function MockReactMarkdown({ children, components, transformLinkUri }) {
    const content = Array.isArray(children) ? children.join('') : children;
    const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(content);
    if (!match) {
      return React.createElement('div', null, content);
    }

    const [, label, href] = match;
    const linkProps = {
      href: transformLinkUri(href),
      children: [label],
    };

    return components.a(linkProps);
  };
});

jest.mock('../../helper', () => ({
  fixUrl: (value) => value,
}));

import { ReferenceContext } from '../../context';
import MarkdownViewer from './MarkdownViewer';

describe('MarkdownViewer', () => {
  const referenceContextValue = {
    state: {},
    actions: {
      goToBookChapterVerse: jest.fn(),
    },
  };

  it('uses the resource release ref for TW links', () => {
    render(
      <ReferenceContext.Provider value={referenceContextValue}>
        <MarkdownViewer
          config={{
            server: 'https://git.door43.org',
            owner: 'unfoldingword',
            languageId: 'en',
            projectId: 'mat',
            listRef: 'v88',
          }}
        >
          {'[Jesus](rc://*/tw/dict/bible/kt/jesus)'}
        </MarkdownViewer>
      </ReferenceContext.Provider>
    );

    expect(screen.getByRole('link', { name: 'Jesus' })).toHaveAttribute(
      'href',
      '#page=https://git.door43.org/unfoldingword/en_tw/raw/tag/v88/bible/kt/jesus.md'
    );
  });

  it('uses the resource release ref for TA links', () => {
    render(
      <ReferenceContext.Provider value={referenceContextValue}>
        <MarkdownViewer
          config={{
            server: 'https://git.door43.org',
            owner: 'unfoldingword',
            languageId: 'en',
            projectId: 'mat',
            ref: 'v88',
          }}
        >
          {'[Explicit](rc://*/ta/man/translate/figs-explicit)'}
        </MarkdownViewer>
      </ReferenceContext.Provider>
    );

    expect(screen.getByRole('link', { name: 'Explicit' })).toHaveAttribute(
      'href',
      '#page=https://git.door43.org/unfoldingword/en_ta/raw/tag/v88/translate/figs-explicit/01.md'
    );
  });
});
