import axios from 'axios';

export const BOOTSTRAP_RELEASE_CACHE_KEY = 'bootstrapReleaseCache:v1';
export const BOOTSTRAP_RELEASE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const ENGLISH_BIBLE_BOOTSTRAP_RESOURCES = [
  {
    owner: 'unfoldingword',
    name: 'en_ult',
    subject: 'Bible',
    title: 'unfoldingWord Literal Text',
    languageId: 'en',
  },
  {
    owner: 'unfoldingword',
    name: 'en_ust',
    subject: 'Aligned Bible',
    title: 'unfoldingWord Simplified Text',
    languageId: 'en',
  },
  {
    owner: 'unfoldingword',
    name: 'en_tn',
    subject: 'TSV Translation Notes',
    title: 'unfoldingWord Translation Notes',
    languageId: 'en',
  },
  {
    owner: 'unfoldingword',
    name: 'en_twl',
    subject: 'TSV Translation Words Links',
    title: 'unfoldingWord Translation Words Links',
    languageId: 'en',
  },
  {
    owner: 'unfoldingword',
    name: 'en_ta',
    subject: 'Translation Academy',
    title: 'unfoldingWord Translation Academy',
    languageId: 'en',
  },
];

let bootstrapResourcesPromise = null;

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const getResourceIdFromName = (resource) => {
  const normalizedLanguageId = resource?.languageId || '';
  const normalizedName = resource?.name || '';

  if (normalizedName.startsWith(`${normalizedLanguageId}_`)) {
    return normalizedName.slice(normalizedLanguageId.length + 1);
  }

  const [, ...resourceParts] = normalizedName.split('_');
  return resourceParts.join('_');
};

const buildResourceLink = (resource, ref) => {
  const resourceId = getResourceIdFromName(resource);

  return `${resource.owner}/${resource.languageId}/${resourceId}/${ref}`;
};

const isValidBootstrapResource = (resource) => {
  return !!(
    resource &&
    resource.owner &&
    resource.name &&
    resource.subject &&
    resource.title &&
    resource.languageId &&
    resource.ref
  );
};

const normalizeBootstrapResource = (resource, ref) => {
  return {
    ...resource,
    ref,
    link: buildResourceLink(resource, ref),
  };
};

const getLatestReleaseTag = (release) => {
  return release?.tag_name || release?.tagName || null;
};

const sortReleasesDescending = (releases = []) => {
  return [...releases].sort((left, right) => {
    const leftTime = Date.parse(left?.published_at || left?.created_at || 0);
    const rightTime = Date.parse(right?.published_at || right?.created_at || 0);
    return rightTime - leftTime;
  });
};

const getStorage = (storage) => {
  if (storage) {
    return storage;
  }
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage;
};

export const getBootstrapReleaseCache = (storage) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return null;
  }

  try {
    const rawValue = targetStorage.getItem(BOOTSTRAP_RELEASE_CACHE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (
      !parsedValue ||
      typeof parsedValue.resolvedAt !== 'number' ||
      !Array.isArray(parsedValue.repos) ||
      !parsedValue.repos.every(isValidBootstrapResource)
    ) {
      return null;
    }

    return parsedValue;
  } catch (error) {
    return null;
  }
};

export const getValidBootstrapResourcesFromCache = (storage, now = Date.now()) => {
  const cache = getBootstrapReleaseCache(storage);
  if (!cache) {
    return null;
  }

  if (now - cache.resolvedAt >= BOOTSTRAP_RELEASE_CACHE_MAX_AGE_MS) {
    return null;
  }

  return cache.repos;
};

export const writeBootstrapReleaseCache = (resources, storage, now = Date.now()) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage || !Array.isArray(resources)) {
    return;
  }

  targetStorage.setItem(
    BOOTSTRAP_RELEASE_CACHE_KEY,
    JSON.stringify({
      resolvedAt: now,
      repos: resources,
    })
  );
};

export const fetchLatestRepoReleaseRef = async (server, owner, repo) => {
  try {
    const latestRelease = await axios.get(
      `${server}/api/v1/repos/${owner}/${repo}/releases/latest`
    );
    const latestTag = getLatestReleaseTag(latestRelease?.data);
    if (latestTag) {
      return latestTag;
    }
  } catch (error) {
    if (error?.response?.status && error.response.status !== 404) {
      throw error;
    }
  }

  const releasesResponse = await axios.get(
    `${server}/api/v1/repos/${owner}/${repo}/releases`
  );
  const releases = sortReleasesDescending(
    (releasesResponse?.data || []).filter(
      (release) => !release?.draft && !release?.prerelease
    )
  );
  const latestTag = getLatestReleaseTag(releases[0]);

  if (!latestTag) {
    throw new Error(`No release tag found for ${owner}/${repo}`);
  }

  return latestTag;
};

export const resolveBootstrapResources = async (
  server,
  resources = ENGLISH_BIBLE_BOOTSTRAP_RESOURCES
) => {
  const settledResources = await Promise.all(
    resources.map(async (resource) => {
      try {
        const ref = await fetchLatestRepoReleaseRef(
          server,
          resource.owner,
          resource.name
        );
        return normalizeBootstrapResource(resource, ref);
      } catch (error) {
        return null;
      }
    })
  );

  return settledResources.filter(Boolean);
};

export const loadBootstrapResources = async ({
  server,
  storage,
  now = Date.now(),
  resources = ENGLISH_BIBLE_BOOTSTRAP_RESOURCES,
} = {}) => {
  const cachedResources = getValidBootstrapResourcesFromCache(storage, now);
  if (cachedResources) {
    return cachedResources;
  }

  if (!bootstrapResourcesPromise) {
    bootstrapResourcesPromise = resolveBootstrapResources(server, resources)
      .then((resolvedResources) => {
        writeBootstrapReleaseCache(resolvedResources, storage, now);
        return resolvedResources;
      })
      .finally(() => {
        bootstrapResourcesPromise = null;
      });
  }

  return bootstrapResourcesPromise;
};

export const resetBootstrapResourceLoaderForTests = () => {
  bootstrapResourcesPromise = null;
};
