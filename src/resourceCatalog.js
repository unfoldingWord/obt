import axios from 'axios';

import { fetchTcReadyRepos, getRepoSlug } from './helper';

const catalogResourcesByLanguageKey = new Map();
const catalogRequestsByLanguageKey = new Map();

const isCoreDefaultResource = (resourceName = '') => {
  const normalizedName = resourceName.toLowerCase();
  return (
    normalizedName.endsWith('_ult') ||
    normalizedName.endsWith('_glt') ||
    normalizedName.endsWith('_ust') ||
    normalizedName.endsWith('_gst') ||
    normalizedName.endsWith('_tn') ||
    normalizedName.endsWith('_twl') ||
    normalizedName.endsWith('_ta')
  );
};

const getLanguageKey = (languageResources = [], subjects = []) => {
  return JSON.stringify({
    languages: [...languageResources].sort(),
    subjects: [...subjects].sort(),
  });
};

const hasSelectedLanguage = (languageResources, languageId) => {
  return languageResources.some((lang) => lang === languageId);
};

const getResourceIdFromCatalogResource = (resource) => {
  if (resource?.name?.startsWith(`${resource?.language}_`)) {
    return resource.name.slice(resource.language.length + 1);
  }

  const [, ...resourceParts] = (resource?.name || '').split('_');
  return resourceParts.join('_');
};

const mapCatalogResource = (resource) => {
  const resourceId = getResourceIdFromCatalogResource(resource);

  return {
    id: resource.id,
    languageId: resource.language.toLowerCase(),
    name: resource.name,
    subject: resource.subject,
    title: resource.title,
    ref: resource.branch_or_tag_name,
    owner: resource.owner.toString().toLowerCase(),
    link: `${resource.owner
      .toString()
      .toLowerCase()}/${resource.language.toLowerCase()}/${resourceId}/${
      resource.branch_or_tag_name
    }`,
  };
};

export const filterResourcesByLanguage = (resources = [], languageResources = []) => {
  return (resources || []).filter((resource) =>
    hasSelectedLanguage(languageResources, resource.languageId)
  );
};

export const fetchCatalogResources = async (server, languageResources, subjects) => {
  const tcReadyRepos = await fetchTcReadyRepos(server);
  const response = await axios.get(
    `${server}/api/v1/catalog/search?limit=1000&sort=lang,title&subject=${subjects.join(
      ','
    )}`
  );

  return (response?.data?.data || [])
    .map(mapCatalogResource)
    .filter(
      (resource) =>
        (tcReadyRepos.has(getRepoSlug(resource.owner, resource.name)) ||
          isCoreDefaultResource(resource.name)) &&
        hasSelectedLanguage(languageResources, resource.languageId)
    );
};

export const loadCatalogResources = async (server, languageResources, subjects) => {
  const languageKey = getLanguageKey(languageResources, subjects);

  if (catalogResourcesByLanguageKey.has(languageKey)) {
    return catalogResourcesByLanguageKey.get(languageKey);
  }

  if (!catalogRequestsByLanguageKey.has(languageKey)) {
    const request = fetchCatalogResources(server, languageResources, subjects)
      .then((resources) => {
        catalogResourcesByLanguageKey.set(languageKey, resources);
        return resources;
      })
      .finally(() => {
        catalogRequestsByLanguageKey.delete(languageKey);
      });

    catalogRequestsByLanguageKey.set(languageKey, request);
  }

  return catalogRequestsByLanguageKey.get(languageKey);
};

export const resetCatalogResourceLoaderForTests = () => {
  catalogRequestsByLanguageKey.clear();
  catalogResourcesByLanguageKey.clear();
};
