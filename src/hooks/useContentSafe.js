import { useEffect, useState } from 'react';
import { useRsrc } from 'scripture-resources-rcl';
import useTsvItems from 'translation-helps-rcl/dist/hooks/useTsvItems';
import {
  CONTENT_NOT_FOUND_ERROR,
  ERROR_STATE,
  INITIALIZED_STATE,
  LOADING_STATE,
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl/dist/common/constants';

import useExtraContentSafe from './useExtraContentSafe';

const useContentSafe = ({
  listRef = 'master',
  contentRef = 'master',
  verse = 1,
  owner,
  server,
  chapter = 1,
  filePath = '',
  projectId,
  languageId,
  resourceId,
  fetchMarkdown = true,
  onResourceError,
  httpConfig = {},
  viewMode = 'markdown',
}) => {
  const [initialized, setInitialized] = useState(false);

  const reference = {
    verse,
    chapter,
    filePath,
    projectId,
    ref: listRef,
  };
  const resourceLink = `${owner}/${languageId}/${resourceId}/${listRef}`;
  const config = {
    server,
    ...httpConfig,
  };

  const {
    state: { content, resource, loadingResource, loadingContent, fetchResponse },
    actions: { reloadResource },
  } = useRsrc({
    resourceLink,
    reference,
    config,
  });

  const {
    items,
    tsvs,
    loading: loadingTSV,
  } = useTsvItems({
    httpConfig: config,
    onResourceError,
    ref: contentRef,
    fetchMarkdown,
    languageId,
    resourceId,
    projectId,
    content,
    chapter,
    server,
    owner,
    verse,
  });

  const contentNotFoundError = !content;
  const manifestNotFoundError = !resource?.manifest;
  const loading = loadingResource || loadingContent || loadingTSV;
  const error =
    initialized && !loading && (contentNotFoundError || manifestNotFoundError);
  const resourceStatus = {
    [LOADING_STATE]: loading,
    [CONTENT_NOT_FOUND_ERROR]: contentNotFoundError,
    [MANIFEST_NOT_LOADED_ERROR]: manifestNotFoundError,
    [ERROR_STATE]: error,
    [INITIALIZED_STATE]: initialized,
  };

  useEffect(() => {
    if (!initialized && loading) {
      setInitialized(true);
    }
  }, [initialized, loading]);

  const { processedItems } = useExtraContentSafe({
    verse,
    owner,
    server,
    chapter,
    filePath,
    projectId,
    languageId,
    resourceId,
    httpConfig,
    viewMode,
    initialized,
    loading,
    items,
    onResourceError,
    reference,
  });

  return {
    tsvs,
    resource,
    fetchResponse,
    resourceStatus,
    reloadResource,
    items: processedItems || items,
    markdown: Array.isArray(content) ? null : content,
    props: {
      verse,
      owner,
      server,
      chapter,
      filePath,
      projectId,
      languageId,
      resourceId,
    },
  };
};

export default useContentSafe;
