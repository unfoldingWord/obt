import React, { useState, useEffect, useContext } from 'react';

import {
  ResourcesContextProvider,
  SelectionsContextProvider,
} from '@texttree/scripture-resources-rcl';
import { useTranslation } from 'react-i18next';

import { ReferenceContext } from '../context';

import {
  getResources,
  getBookList,
  checkLSVal,
  getLayoutType,
  getDefaultBibleLayout,
} from '../helper';
import { subjects } from '../config/materials';
import {
  defaultTplBible,
  defaultTplOBS,
  languages,
  bibleList,
  server,
} from '../config/base';
import { loadCatalogResources } from '../resourceCatalog';
import {
  getValidBootstrapResourcesFromCache,
  loadBootstrapResources,
} from '../resourceBootstrap';

export const AppContext = React.createContext();

const _currentLanguage = checkLSVal('i18nextLng', languages[0]);
const _fontSize = parseInt(localStorage.getItem('fontSize'));
const _layoutStorage = localStorage.getItem('layoutStorage');

const getInitialResourcesApp = () => {
  return getValidBootstrapResourcesFromCache() || [];
};

const getLayoutSignature = (layout = {}) => {
  return ['lg', 'md', 'sm']
    .map((breakpoint) =>
      (layout?.[breakpoint] || [])
        .map(({ i, w, h, x, y }) => `${i}:${w}:${h}:${x}:${y}`)
        .sort()
        .join('|')
    )
    .join('||');
};

export function AppContextProvider({ children }) {
  const {
    state: { referenceSelected },
    actions: { setNewBookList },
  } = useContext(ReferenceContext);

  const [theme, setTheme] = useState(() => checkLSVal('theme', 'textTree'));
  const [taRef, setTaRef] = useState();

  const [currentLanguage, setCurrentLanguage] = useState(_currentLanguage);
  const [appConfig, setAppConfig] = useState(
    () =>
      checkLSVal(
        'appConfig',
        {
          bible: getDefaultBibleLayout(_currentLanguage, getInitialResourcesApp()),
          obs: defaultTplOBS[_currentLanguage],
        },
        'object',
        'bible'
      )[referenceSelected.bookId === 'obs' ? 'obs' : 'bible']
  );

  const [breakpoint, setBreakpoint] = useState({ name: 'lg', cols: 12 });
  const [switchChunks, setSwitchChunks] = useState(() => {
    return checkLSVal('switchChunks', false, 'boolean');
  });
  const [switchTypeUniqueWords, setSwitchTypeUniqueWords] = useState(() => {
    return checkLSVal('switchTypeUniqueWords', 'disabled', 'string');
  });
  const [switchHideRepeatedWords, setSwitchHideRepeatedWords] = useState(() => {
    return checkLSVal('switchHideRepeatedWords', false, 'boolean');
  });
  const [switchExtraTitleCard, setSwitchExtraTitleCard] = useState(() => {
    return checkLSVal('switchExtraTitleCard', true, 'boolean');
  });
  const [switchObsImage, setSwitchObsImage] = useState(() => {
    return checkLSVal('switchObsImage', true, 'boolean');
  });
  const [switchMasterOnly, setSwitchMasterOnly] = useState(() => {
    return checkLSVal('switchMasterOnly', false, 'boolean');
  });
  const [switchWordPopover, setSwitchWordPopover] = useState(() => {
    return checkLSVal('switchWordPopover', false, 'boolean');
  });
  /** TODO Create ResourceContext
   * 1. Get information about resources ( like available bookId) from /Chapter  - content.resources.project.
   * 2. Put all states about resources in ResourceContext.
   * 3. Maybe make availableBookList in ResourceContext
   */
  const [resourcesApp, setResourcesApp] = useState(() => {
    return getInitialResourcesApp();
  });
  const [initialResourcesLoading, setInitialResourcesLoading] = useState(
    () => getInitialResourcesApp().length === 0
  );
  const [bootstrapResolving, setBootstrapResolving] = useState(false);

  const _resourceLinks = getResources(appConfig, resourcesApp);
  const [resourceLinks, setResourceLinks] = useState(_resourceLinks);
  const [resources, setResources] = useState([]);
  const [showBookSelect, setShowBookSelect] = useState(false);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDownloadLayout, setShowDownloadLayout] = useState(false);
  const [errorFile, setErrorFile] = useState('');
  const [fontSize, setFontSize] = useState(_fontSize ? _fontSize : 100);
  const [loadIntro, setLoadIntro] = useState(false);
  const [layoutStorage, setLayoutStorage] = useState(
    _layoutStorage ? JSON.parse(_layoutStorage) : []
  );
  const [openStartDialog, setOpenStartDialog] = useState(() => {
    return checkLSVal('startDialog', true, 'boolean');
  });
  const [openMainMenu, setOpenMainMenu] = useState(false);
  const [languageResources, setLanguageResources] = useState(() => {
    return checkLSVal('languageResources', ['en'], 'object');
  });

  const config = { server };
  const { t } = useTranslation();

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('layoutStorage', JSON.stringify(layoutStorage));
  }, [layoutStorage]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('switchObsImage', switchObsImage);
  }, [switchObsImage]);

  useEffect(() => {
    localStorage.setItem('switchMasterOnly', switchMasterOnly);
  }, [switchMasterOnly]);

  useEffect(() => {
    localStorage.setItem('switchChunks', switchChunks);
  }, [switchChunks]);

  useEffect(() => {
    localStorage.setItem('switchExtraTitleCard', switchExtraTitleCard);
  }, [switchExtraTitleCard]);

  useEffect(() => {
    localStorage.setItem('switchTypeUniqueWords', switchTypeUniqueWords);
  }, [switchTypeUniqueWords]);

  useEffect(() => {
    localStorage.setItem('switchHideRepeatedWords', switchHideRepeatedWords);
  }, [switchHideRepeatedWords]);

  useEffect(() => {
    localStorage.setItem('switchWordPopover', switchWordPopover);
  }, [switchWordPopover]);

  useEffect(() => {
    const type = getLayoutType(appConfig.lg);
    const newType = referenceSelected.bookId === 'obs' ? 'obs' : 'bible';
    if (type !== newType) {
      try {
        const appConfigStr = localStorage.getItem('appConfig');
        const parsedConfig = appConfigStr ? JSON.parse(appConfigStr) : null;
        if (parsedConfig && parsedConfig[newType]) {
          setAppConfig(parsedConfig[newType]);
        }
      } catch (error) {
        // Handle error silently, appConfig will remain unchanged
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceSelected.bookId]);

  useEffect(() => {
    if (referenceSelected.bookId === 'obs' || !resourcesApp.length) {
      return;
    }

    const fallbackLayout = defaultTplBible[currentLanguage];
    const hasFallbackLayout =
      getLayoutSignature(appConfig) === getLayoutSignature(fallbackLayout);
    if (!hasFallbackLayout) {
      return;
    }

    const nextBibleLayout = getDefaultBibleLayout(currentLanguage, resourcesApp);
    const isUpgradedLayout =
      getLayoutSignature(nextBibleLayout) !== getLayoutSignature(fallbackLayout);
    if (!isUpgradedLayout) {
      return;
    }

    setAppConfig(nextBibleLayout);
    try {
      const appConfigStr = localStorage.getItem('appConfig');
      const parsedConfig = appConfigStr ? JSON.parse(appConfigStr) : {};
      localStorage.setItem(
        'appConfig',
        JSON.stringify({
          ...parsedConfig,
          bible: nextBibleLayout,
        })
      );
    } catch (error) {
      // keep state update even if localStorage parse fails
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesApp, currentLanguage, referenceSelected.bookId]);

  useEffect(() => {
    setResourceLinks(getResources(appConfig, resourcesApp));
  }, [appConfig, resourcesApp, breakpoint]);

  useEffect(() => {
    setNewBookList(getBookList(bibleList, t), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem('resourcesApp', JSON.stringify(resourcesApp));
  }, [resourcesApp]);
  useEffect(() => {
    localStorage.setItem('languageResources', JSON.stringify(languageResources));
  }, [languageResources]);

  useEffect(() => {
    localStorage.setItem('loadIntro', loadIntro);
  }, [loadIntro]);

  useEffect(() => {
    localStorage.setItem('startDialog', openStartDialog);
  }, [openStartDialog]);

  useEffect(() => {
    let isMounted = true;
    const isEnglishBibleBootstrap =
      referenceSelected.bookId !== 'obs' &&
      currentLanguage === 'en' &&
      languageResources.length === 1 &&
      languageResources[0] === 'en';
    const cachedBootstrapResources = isEnglishBibleBootstrap
      ? getValidBootstrapResourcesFromCache()
      : null;

    const loadInitialResources = async () => {
      setBootstrapResolving(true);
      setInitialResourcesLoading(!cachedBootstrapResources?.length);

      try {
        const nextResources = isEnglishBibleBootstrap
          ? await loadBootstrapResources({ server })
          : await loadCatalogResources(server, languageResources, subjects);

        if (!isMounted) {
          return;
        }

        setResourcesApp(nextResources);
      } catch (error) {
        console.log(error);
      } finally {
        if (!isMounted) {
          return;
        }

        setBootstrapResolving(false);
        setInitialResourcesLoading(false);
      }
    };

    loadInitialResources();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, languageResources, referenceSelected.bookId === 'obs']);

  const [quote, setQuote] = useState('');
  const [occurrence, setOccurrence] = useState(0);
  const [selections, setSelections] = useState([{}]);
  const value = {
    state: {
      taRef,
      appConfig,
      breakpoint,
      currentLanguage,
      errorFile,
      fontSize,
      loadIntro,
      languageResources,
      openMainMenu,
      openStartDialog,
      resourceLinks,
      resourcesApp,
      resources,
      initialResourcesLoading,
      bootstrapResolving,
      _resourceLinks,
      showBookSelect,
      showChapterSelect,
      showErrorReport,
      switchObsImage,
      switchMasterOnly,
      switchChunks,
      switchExtraTitleCard,
      switchWordPopover,
      switchTypeUniqueWords,
      switchHideRepeatedWords,
      theme,
      showSettingsMenu,
      layoutStorage,
      showDownloadLayout,
      quote,
      selections,
      occurrence,
    },
    actions: {
      setTaRef,
      setAppConfig,
      setBreakpoint,
      setCurrentLanguage,
      setErrorFile,
      setFontSize,
      setLoadIntro,
      setLanguageResources,
      setOpenMainMenu,
      setOpenStartDialog,
      setResourceLinks,
      setResourcesApp,
      setResources,
      setInitialResourcesLoading,
      setShowBookSelect,
      setShowChapterSelect,
      setShowErrorReport,
      setSwitchObsImage,
      setSwitchMasterOnly,
      setSwitchChunks,
      setSwitchExtraTitleCard,
      setSwitchWordPopover,
      setSwitchTypeUniqueWords,
      setSwitchHideRepeatedWords,
      setTheme,
      setShowSettingsMenu,
      setLayoutStorage,
      setShowDownloadLayout,
      setSelections,
      setQuote,
      setOccurrence,
    },
  };

  return (
    <AppContext.Provider value={value}>
      <ResourcesContextProvider
        reference={{
          bookId: referenceSelected.bookId,
          chapter: referenceSelected.chapter,
        }}
        resourceLinks={resourceLinks}
        defaultResourceLinks={_resourceLinks}
        onResourceLinks={setResourceLinks}
        resources={resources}
        onResources={setResources}
        config={config}
      >
        <SelectionsContextProvider
          quote={quote}
          occurrence={occurrence}
          selections={selections}
          onSelections={setSelections}
        >
          {children}
        </SelectionsContextProvider>
      </ResourcesContextProvider>
    </AppContext.Provider>
  );
}
