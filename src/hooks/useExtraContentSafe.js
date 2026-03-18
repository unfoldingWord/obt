import { useEffect, useState } from 'react';
import isEqual from 'deep-equal';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { addGlQuotesTo, getGlAlignmentBiblesList } from 'translation-helps-rcl/dist/core';

import { loadGlAlignmentBibles } from '../glAlignment';

const useExtraContentSafe = ({
  verse = 1,
  owner,
  server,
  chapter = 1,
  filePath = '',
  projectId,
  languageId,
  resourceId,
  httpConfig = {},
  viewMode = 'markdown',
  initialized,
  loading,
  items,
  error,
  onResourceError,
  reference,
}) => {
  const twlListView = resourceId === 'twl' && viewMode === 'list';
  const [loadingGlData, setLoadingGlData] = useState(false);
  const [glBiblesList, setGlBiblesList] = useOptionalLocalStorageState(
    'twl_list_view_gl_bible_list',
    null,
    twlListView
  );
  const [glBibles, setGlBibles] = useState(null);
  const [glLoadedProjectId, setGlLoadedProjectId] = useState(null);
  const [processedItems, setProcessedItems] = useState(null);

  useDeepCompareEffect(() => {
    let isActive = true;

    const loadGlData = async () => {
      const currentGlRepo = `${owner}/${languageId}`;
      let glBibles_ = glBibles;
      let glBiblesList_ = glBiblesList;

      if (glBibles_ && glLoadedProjectId !== projectId) {
        if (isActive) {
          setGlBibles(null);
          setProcessedItems(null);
        }
        glBibles_ = null;
      }

      if (glBiblesList_ && glBiblesList_.repo !== currentGlRepo) {
        if (isActive) {
          setGlBiblesList(null);
          setProcessedItems(null);
        }
        glBiblesList_ = null;
      }

      if (!glBiblesList_) {
        if (isActive) {
          setProcessedItems(null);
          setGlBibles(null);
        }
        const newGlBiblesList = await getGlAlignmentBiblesList(
          languageId,
          httpConfig,
          server,
          owner
        );
        glBiblesList_ = {
          repo: currentGlRepo,
          bibles: newGlBiblesList,
        };
        if (isActive) {
          setGlBiblesList(glBiblesList_);
        }
        glBibles_ = null;
      }

      if (!glBibles_ && glBiblesList_) {
        if (isActive) {
          setProcessedItems(null);
        }
        glBibles_ = await loadGlAlignmentBibles({
          owner,
          glBibleList: glBiblesList_.bibles,
          httpConfig,
          server,
          reference,
        });
        if (isActive) {
          setGlBibles(glBibles_);
          setGlLoadedProjectId(projectId);
        }
      }
    };

    if (twlListView && initialized && !loading && !error && !loadingGlData) {
      setLoadingGlData(true);
      loadGlData()
        .catch(() => {
          // swallow errors, resourceStatus handles UI feedback
        })
        .finally(() => {
          if (isActive) {
            setLoadingGlData(false);
          }
        });
    }

    return () => {
      isActive = false;
    };
  }, [
    {
      initialized,
      loading,
      error,
      loadingGlData,
      projectId,
      glBibles,
      glBiblesList,
      reference,
      languageId,
      owner,
    },
  ]);

  useDeepCompareEffect(() => {
    if (twlListView) {
      if (initialized && !loading && !error && !loadingGlData) {
        if (glBibles && items?.length) {
          const newItems = addGlQuotesTo(chapter, verse, items, glBibles);
          if (!isEqual(processedItems, newItems)) {
            setProcessedItems(newItems);
          }
        } else if (processedItems) {
          setProcessedItems(null);
        }
      } else if (processedItems) {
        setProcessedItems(null);
      }
    }
  }, [
    {
      initialized,
      loading,
      error,
      loadingGlData,
      glBibles,
      items,
    },
  ]);

  function useOptionalLocalStorageState(key, value, isEnabled) {
    const [state, setState] = useState(() => {
      if (!isEnabled) {
        return value;
      }
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : value;
      } catch (error) {
        return value;
      }
    });

    useEffect(() => {
      if (!isEnabled) {
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        // ignore storage failures
      }
    }, [isEnabled, key, state]);

    return [state, setState];
  }

  return {
    processedItems,
  };
};

export default useExtraContentSafe;
