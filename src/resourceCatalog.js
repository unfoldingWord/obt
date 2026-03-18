import axios from 'axios';

import { fetchTcReadyRepos, getRepoSlug } from './helper';

const catalogResourcesBySubjectKey = new Map();
const catalogRequestsBySubjectKey = new Map();

const getSubjectKey = (subjects = []) => {
  return JSON.stringify({
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
  if (!Array.isArray(languageResources) || languageResources.length === 0) {
    return resources;
  }

  return (resources || []).filter((resource) =>
    hasSelectedLanguage(languageResources, resource.languageId)
  );
};

export const getCatalogLanguageIds = (resources = []) => {
  return Array.from(
    new Set((resources || []).map((resource) => resource.languageId).filter(Boolean))
  );
};

export const fetchCatalogResources = async (server, subjects) => {
  const tcReadyRepos = await fetchTcReadyRepos(server);
  const response = await axios.get(
    `${server}/api/v1/catalog/search?limit=1000&sort=lang,title&subject=${subjects.join(
      ','
    )}`
  );

  return (response?.data?.data || [])
    .map(mapCatalogResource)
    .filter((resource) => tcReadyRepos.has(getRepoSlug(resource.owner, resource.name)));
};

const loadCatalogResourceIndex = async (server, subjects) => {
  const subjectKey = getSubjectKey(subjects);

  if (catalogResourcesBySubjectKey.has(subjectKey)) {
    return catalogResourcesBySubjectKey.get(subjectKey);
  }

  if (!catalogRequestsBySubjectKey.has(subjectKey)) {
    const request = fetchCatalogResources(server, subjects)
      .then((resources) => {
        catalogResourcesBySubjectKey.set(subjectKey, resources);
        return resources;
      })
      .finally(() => {
        catalogRequestsBySubjectKey.delete(subjectKey);
      });

    catalogRequestsBySubjectKey.set(subjectKey, request);
  }

  return catalogRequestsBySubjectKey.get(subjectKey);
};

export const loadCatalogResources = async (server, languageResources, subjects) => {
  const resources = await loadCatalogResourceIndex(server, subjects);
  return filterResourcesByLanguage(resources, languageResources);
};

export const loadCatalogLanguageIds = async (server, subjects) => {
  const resources = await loadCatalogResourceIndex(server, subjects);
  return getCatalogLanguageIds(resources);
};

export const resetCatalogResourceLoaderForTests = () => {
  catalogRequestsBySubjectKey.clear();
  catalogResourcesBySubjectKey.clear();
};
