import { useContext, useMemo } from 'react';

import { ResourcesContext } from '@texttree/scripture-resources-rcl';

const getResourceId = (resource = {}) => resource?.name?.split('_')[1];

const useChapterContent = ({ reference, resource }) => {
  const { state: resourcesState = {} } = useContext(ResourcesContext);

  return useMemo(() => {
    const resources = resourcesState.resources || [];
    const books = resourcesState.books;
    const resourceId = getResourceId(resource);
    const resourceIndex = resources.findIndex((candidate) => {
      return (
        candidate?.username === resource?.owner &&
        candidate?.languageId === resource?.languageId &&
        candidate?.resourceId === resourceId &&
        candidate?.tag === resource?.ref &&
        candidate?.projectId === reference?.bookId
      );
    });

    const matchedResource = resourceIndex >= 0 ? resources[resourceIndex] : null;
    const matchedBook =
      resourceIndex >= 0 && Array.isArray(books) ? books[resourceIndex] : null;
    const chapterData = matchedBook?.json?.chapters?.[reference?.chapter] || null;
    const resourcesReady = resources.length > 0;
    const booksReady = Array.isArray(books);
    const loading = !resourcesReady || !booksReady || resourceIndex < 0;
    const contentNotFoundError = !loading && !chapterData;

    return {
      resource: matchedResource,
      chapterData,
      resourceStatus: {
        loading,
        contentNotFoundError,
        error: contentNotFoundError,
      },
    };
  }, [
    reference?.bookId,
    reference?.chapter,
    resource,
    resourcesState.books,
    resourcesState.resources,
  ]);
};

export default useChapterContent;
