import React from 'react';
import { render, screen } from '@testing-library/react';

import Card from './Card';
import { AppContext, ReferenceContext } from '../../context';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        Problem_loading: 'There was a problem loading content.',
      })[key] || key,
  }),
}));

jest.mock('translation-helps-rcl', () => ({
  Card: ({ children, id }) => <div data-testid={`translation-card-${id}`}>{children}</div>,
}));

jest.mock('../../components', () => ({
  Chapter: () => <div>Chapter</div>,
  SupportTQ: () => <div>SupportTQ</div>,
  SupportTN: () => <div>SupportTN</div>,
  SupportTWL: () => <div>SupportTWL</div>,
  OBSVerses: () => <div>OBSVerses</div>,
  SupportOBSTN: () => <div>SupportOBSTN</div>,
  SupportOBSTQ: () => <div>SupportOBSTQ</div>,
  SupportOBSSQ: () => <div>SupportOBSSQ</div>,
  SupportOBSSN: () => <div>SupportOBSSN</div>,
  SupportOBSTWL: () => <div>SupportOBSTWL</div>,
  SupportTA: () => <div>SupportTA</div>,
}));

jest.mock('../../context', () => {
  const React = require('react');
  return {
    AppContext: React.createContext(),
    ReferenceContext: React.createContext(),
  };
});

const renderCard = ({ initialResourcesLoading }) =>
  render(
    <AppContext.Provider
      value={{
        state: {
          resourcesApp: [],
          fontSize: 100,
          switchExtraTitleCard: false,
          switchMasterOnly: false,
          initialResourcesLoading,
        },
        actions: {},
      }}
    >
      <ReferenceContext.Provider
        value={{
          state: {
            referenceSelected: {
              bookId: 'mat',
              chapter: 1,
              verse: 1,
            },
          },
          actions: {},
        }}
      >
        <Card type="unfoldingword__en_ult" onClose={jest.fn()} classes={{}} />
      </ReferenceContext.Provider>
    </AppContext.Provider>
  );

describe('Card initial loading placeholder', () => {
  it('renders a spinner while the initial resource catalog is loading', () => {
    renderCard({ initialResourcesLoading: true });

    expect(screen.getByTestId('translation-card-unfoldingword__en_ult')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a loading problem message after the initial resource catalog completes', () => {
    renderCard({ initialResourcesLoading: false });

    expect(screen.getByText('There was a problem loading content.')).toBeInTheDocument();
  });
});
