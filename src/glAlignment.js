import { core as scriptureResourcesCore } from 'scripture-resources-rcl';

import {
  fetchLatestRepoReleaseRef,
  getValidBootstrapResourcesFromCache,
} from './resourceBootstrap';

const stripChapterAndVerse = (reference = {}) => {
  const nextReference = { ...reference };
  delete nextReference.chapter;
  delete nextReference.verse;
  return nextReference;
};

const getCachedBootstrapRef = (owner, repo, storage) => {
  const cachedResources = getValidBootstrapResourcesFromCache(storage);
  const cachedResource = cachedResources?.find(
    (resource) => resource.owner === owner && resource.name === repo
  );

  return cachedResource?.ref || null;
};

export const getLatestReleasedRef = async ({ server, owner, repo, storage }) => {
  const cachedRef = getCachedBootstrapRef(owner, repo, storage);
  if (cachedRef) {
    return cachedRef;
  }

  return fetchLatestRepoReleaseRef(server, owner, repo);
};

export const loadGlAlignmentBible = async ({
  owner,
  glBible,
  httpConfig = {},
  server,
  reference,
  storage,
}) => {
  const [languageId, resourceId] = glBible.split('_');
  if (!languageId || !resourceId) {
    return null;
  }

  const repo = `${languageId}_${resourceId}`;
  const ref = await getLatestReleasedRef({
    server,
    owner,
    repo,
    storage,
  });
  const resource = await scriptureResourcesCore.resourceFromResourceLink({
    resourceLink: `${owner}/${languageId}/${resourceId}/${ref}`,
    reference: stripChapterAndVerse(reference),
    config: {
      ...httpConfig,
      server,
    },
  });

  if (!resource?.manifest || !resource?.project?.parseUsfm) {
    return null;
  }

  const fileResults = await resource.project.parseUsfm();
  if (!fileResults?.json) {
    return null;
  }

  return {
    ...resource,
    json: fileResults.json,
  };
};

export const loadGlAlignmentBibles = async ({
  owner,
  glBibleList = [],
  httpConfig = {},
  server,
  reference,
  storage,
}) => {
  const loadedBibles = await Promise.all(
    glBibleList.map(async (glBible) => {
      try {
        return await loadGlAlignmentBible({
          owner,
          glBible,
          httpConfig,
          server,
          reference,
          storage,
        });
      } catch (error) {
        return null;
      }
    })
  );

  return loadedBibles.filter(Boolean);
};
