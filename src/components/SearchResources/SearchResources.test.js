import React from 'react';

import { render, waitFor } from '@testing-library/react';

import { AppContext, ReferenceContext } from '../../context';
import SearchResources from './SearchResources';

const mockSelectResourcesLanguages = jest.fn(() => null);

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
  }),
}));

jest.mock('../../components', () => ({
  SelectResourcesLanguages: (props) => mockSelectResourcesLanguages(props),
  DialogUI: ({ children }) => <>{children}</>,
  FeedbackDialog: () => null,
}));

jest.mock('../../resourceCatalog', () => ({
  filterResourcesByLanguage: jest.fn((resources) => resources),
  loadCatalogLanguageIds: jest.fn(),
  loadCatalogResources: jest.fn(),
}));

import { loadCatalogLanguageIds, loadCatalogResources } from '../../resourceCatalog';

describe('SearchResources', () => {
  const appContextValue = {
    state: {
      appConfig: {
        lg: [],
        md: [],
        sm: [],
      },
      resourcesApp: [],
      languageResources: ['en'],
    },
    actions: {
      setAppConfig: jest.fn(),
      setResourcesApp: jest.fn(),
    },
  };

  const referenceContextValue = {
    state: {
      referenceSelected: {
        bookId: 'mat',
      },
    },
  };

  const renderSearchResources = (open) => {
    return render(
      <ReferenceContext.Provider value={referenceContextValue}>
        <AppContext.Provider value={appContextValue}>
          <SearchResources anchorEl={document.body} onClose={jest.fn()} open={open} />
        </AppContext.Provider>
      </ReferenceContext.Provider>
    );
  };

  beforeEach(() => {
    loadCatalogResources.mockReset();
    loadCatalogLanguageIds.mockReset();
    appContextValue.actions.setAppConfig.mockReset();
    appContextValue.actions.setResourcesApp.mockReset();
    mockSelectResourcesLanguages.mockClear();
  });

  it('does not fetch the catalog on mount when the menu is closed', () => {
    renderSearchResources(false);

    expect(loadCatalogResources).not.toHaveBeenCalled();
  });

  it('fetches the catalog the first time the menu is opened', async () => {
    loadCatalogResources.mockResolvedValueOnce([]);
    loadCatalogLanguageIds.mockResolvedValueOnce(['en', 'fr']);

    renderSearchResources(true);

    await waitFor(() => {
      expect(loadCatalogResources).toHaveBeenCalledTimes(1);
      expect(loadCatalogLanguageIds).toHaveBeenCalledTimes(1);
      expect(mockSelectResourcesLanguages).toHaveBeenCalledWith(
        expect.objectContaining({
          availableLanguageIds: ['en', 'fr'],
        })
      );
    });
  });
});
