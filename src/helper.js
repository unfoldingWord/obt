import axios from 'axios';
import { cloneDeep, isEqual } from 'lodash';

import {
  defaultTplBible,
  defaultTplOBS,
  defaultBibleReference,
  defaultOBSReference,
} from './config/base';

export const getResources = (appConfig, resourcesApp) => {
  const resources = [];
  if (!appConfig?.lg || appConfig.lg.length > 0) {
    appConfig.lg.forEach((el) => {
      resourcesApp.forEach((r_el) => {
        if (
          r_el?.subject &&
          [
            'Bible',
            'Aligned Bible',
            'Hebrew Old Testament',
            'Greek New Testament',
          ].includes(r_el.subject) &&
          r_el.owner + '__' + r_el.name === el.i
        ) {
          resources.push(r_el.link);
        }
      });
    });
  }
  return resources;
};

export const getBookList = (bibleList, t) => {
  const result = [];
  bibleList.forEach((el) => {
    result.push({ key: el.identifier, name: t(el.identifier), label: t(el.identifier) });
  });
  return result;
};

export const mergeLanguageResources = (prev = [], next = []) => {
  const normalizedNext = Array.from(new Set((next || []).filter(Boolean)));
  const hasSameValues =
    prev.length === normalizedNext.length &&
    prev.every((languageId, index) => languageId === normalizedNext[index]);

  return hasSameValues ? prev : normalizedNext;
};

export const getUniqueResources = (appConfig, resourcesApp) => {
  if (!appConfig?.lg || appConfig.lg.length === 0) {
    return resourcesApp;
  }
  const opened = appConfig.lg.map((el) => el.i);
  return resourcesApp.filter((el) => !opened.includes(el.owner + '__' + el.name));
};

export const getRepoSlug = (owner, name) => {
  return `${(owner ?? '').toString().toLowerCase()}/${(name ?? '')
    .toString()
    .toLowerCase()}`;
};

const getResourceType = (resourceName = '') => {
  const normalizedName = resourceName.toLowerCase();

  if (normalizedName.endsWith('_ult') || normalizedName.endsWith('_glt'))
    return 'literal';
  if (normalizedName.endsWith('_ust') || normalizedName.endsWith('_gst'))
    return 'simplified';
  if (normalizedName.endsWith('_tn')) return 'tn';
  if (normalizedName.endsWith('_twl')) return 'twl';
  if (normalizedName.endsWith('_ta')) return 'ta';

  return null;
};

const generateMdLayout = (lgLayout) => {
  const resources = lgLayout.map((item) => item.i.split('__').join('/'));
  const mdHeight = Math.ceil(12 / Math.ceil(resources.length / 2));

  return resources.map((el, index) => ({
    w: 3,
    h: mdHeight,
    x: (index * 3) % 6,
    y: Math.floor(index / 2) * mdHeight,
    i: el.split('/').join('__'),
    minW: 1,
    minH: 3,
  }));
};

const generateSmLayout = (lgLayout) => {
  const resources = lgLayout.map((item) => item.i.split('__').join('/'));

  return resources.map((el, index) => ({
    w: 1,
    h: resources.length === 1 ? 8 : 4,
    x: 0,
    y: index * 4,
    i: el.split('/').join('__'),
    minH: 3,
    minW: 1,
  }));
};

export const getDefaultBibleLayout = (currentLanguage, resourcesApp = []) => {
  const targetTypes = ['literal', 'simplified', 'tn', 'twl', 'ta'];
  const preferredOwners = ['unfoldingword', 'door43-catalog'];
  const getOwnerPriority = (owner = '') => {
    const normalizedOwner = owner.toLowerCase();
    const index = preferredOwners.indexOf(normalizedOwner);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const resourcesByType = {};

  resourcesApp.forEach((resource) => {
    if (!resource || resource.languageId !== currentLanguage) {
      return;
    }

    const type = getResourceType(resource.name);
    if (!type) {
      return;
    }

    const nextResource = {
      i: `${resource.owner}__${resource.name}`,
      priority: getOwnerPriority(resource.owner),
      minH: 3,
      minW: 1,
    };
    const currentResource = resourcesByType[type];
    if (!currentResource) {
      resourcesByType[type] = nextResource;
      return;
    }

    if (nextResource.priority < currentResource.priority) {
      resourcesByType[type] = nextResource;
    }
  });

  const hasAnyResource = targetTypes.some((type) => !!resourcesByType[type]);
  if (!hasAnyResource) {
    return defaultTplBible[currentLanguage];
  }

  const groups = [];
  if (resourcesByType.literal) {
    groups.push([{ w: 4, h: 12, y: 0, ...resourcesByType.literal }]);
  }
  if (resourcesByType.simplified || resourcesByType.twl) {
    if (resourcesByType.simplified && resourcesByType.twl) {
      groups.push([
        { w: 4, h: 6, y: 0, ...resourcesByType.simplified },
        { w: 4, h: 6, y: 6, ...resourcesByType.twl },
      ]);
    } else if (resourcesByType.simplified) {
      groups.push([{ w: 4, h: 12, y: 0, ...resourcesByType.simplified }]);
    } else {
      groups.push([{ w: 4, h: 12, y: 0, ...resourcesByType.twl }]);
    }
  }
  if (resourcesByType.tn || resourcesByType.ta) {
    if (resourcesByType.tn && resourcesByType.ta) {
      groups.push([
        { w: 4, h: 6, y: 0, ...resourcesByType.tn },
        { w: 4, h: 6, y: 6, ...resourcesByType.ta },
      ]);
    } else if (resourcesByType.tn) {
      groups.push([{ w: 4, h: 12, y: 0, ...resourcesByType.tn }]);
    } else {
      groups.push([{ w: 4, h: 12, y: 0, ...resourcesByType.ta }]);
    }
  }

  const lg = groups.flatMap((group, groupIndex) =>
    group.map(({ priority, ...card }) => ({ ...card, x: groupIndex * 4 }))
  );

  return {
    lg,
    md: generateMdLayout(lg),
    sm: generateSmLayout(lg),
  };
};

export const fetchTcReadyRepos = async (server) => {
  const repos = [];
  const perPage = 25;
  let page = 1;

  while (true) {
    const response = await axios.get(`${server}/api/v1/repos/search`, {
      params: {
        topic: 'tc-ready',
        limit: perPage,
        page,
      },
    });
    const pageRepos = response?.data?.data ?? [];
    repos.push(...pageRepos);

    if (pageRepos.length < perPage) {
      break;
    }
    page += 1;
  }

  return new Set(
    repos
      .map((repo) => {
        const owner = repo.owner?.username || repo.owner?.login || repo.owner?.name || '';
        return getRepoSlug(owner, repo.name);
      })
      .filter((slug) => slug !== '/')
  );
};

// +
const getText = (verseObject) => {
  return verseObject.text || verseObject.nextChar || '';
};

// +
const getFootnote = (verseObject) => {
  return '/fn ' + verseObject.content + ' fn/';
};

// +
const getMilestone = (verseObject, showUnsupported) => {
  const { tag, children } = verseObject;

  switch (tag) {
    case 'k':
      return children.map((child) => getObject(child, showUnsupported)).join(' ');
    case 'zaln':
      if (children.length === 1 && children[0].type === 'milestone') {
        return getObject(children[0], showUnsupported);
      } else {
        return getAlignedWords(children);
      }
    default:
      return '';
  }
};

// +
const getAlignedWords = (verseObjects) => {
  return verseObjects
    .map((verseObject) => {
      return getWord(verseObject);
    })
    .join('');
};

// +
const getSection = (verseObject) => {
  return verseObject.content;
};

// +
const getUnsupported = (verseObject) => {
  return (
    '/' +
    verseObject.tag +
    ' ' +
    (verseObject.content || verseObject.text) +
    ' ' +
    verseObject.tag +
    '/'
  );
};

// +
const getWord = (verseObject) => {
  return verseObject.text || verseObject.content;
};

export const getVerseText = (verseObjects, showUnsupported = false) => {
  return verseObjects
    ?.map((verseObject) => getObject(verseObject, showUnsupported))
    .join('');
};

const getObject = (verseObject, showUnsupported) => {
  const { type } = verseObject;

  switch (type) {
    case 'quote':
    case 'text':
      return getText(verseObject);
    case 'milestone':
      return getMilestone(verseObject, showUnsupported);
    case 'word':
      if (verseObject.strong) {
        return getAlignedWords([verseObject]);
      } else {
        return getWord(verseObject);
      }
    case 'section':
      return getSection(verseObject);
    case 'paragraph':
      return '\n';
    case 'footnote':
      return getFootnote(verseObject);
    default:
      if (showUnsupported) {
        return getUnsupported(verseObject);
      } else {
        return '';
      }
  }
};

export const langArrToObject = (langs) => {
  let result = {};
  langs.forEach((el) => {
    result[el] = { translation: require(`./config/locales/${el}/translation.json`) };
  });
  return result;
};
/**
 *
 * @param {string} el Name
 * @param {*} val default value
 * @param {string} type is string or object or bool
 * @param {string} ext if value is object, check element
 * @returns
 */
export const checkLSVal = (el, val, type = 'string', ext = false) => {
  let value;
  switch (type) {
    case 'object':
      try {
        value = JSON.parse(localStorage.getItem(el));
      } catch (error) {
        localStorage.setItem(el, JSON.stringify(val));
        return val;
      }
      break;
    case 'boolean':
      if (localStorage.getItem(el) === null) {
        value = null;
      } else {
        value = localStorage.getItem(el) === 'true';
      }
      break;

    case 'string':
    default:
      value = localStorage.getItem(el);
      break;
  }

  if (value === null || (ext && !value[ext])) {
    localStorage.setItem(el, type === 'string' ? val : JSON.stringify(val));
    return val;
  } else {
    return value;
  }
};

export const animate = ({ timing, draw, duration = 1000 }) => {
  let start = performance.now();

  requestAnimationFrame(function animate(time) {
    // timeFraction goes from 0 to 1
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;

    // calculate the current animation state
    let progress = timing(timeFraction);

    draw(progress); // draw it

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
};
const easeInOut = (timeFraction) => {
  if (timeFraction < 0.5) {
    return timeFraction * timeFraction * 2;
  } else {
    return 1 - (1 - timeFraction) * (1 - timeFraction) * 2;
  }
};

/*const linear = (timeFraction) => {
  return timeFraction;
};*/

export const animateScrollTo = (currentVerse, position) => {
  if (!currentVerse.clientHeight && !currentVerse.parentNode?.clientHeight) {
    return false;
  }
  const duration = 1000;
  const draw = (tf) => {
    let offset = 0;
    const top = currentVerse.offsetTop - 12;
    switch (position) {
      case 'center':
        offset = currentVerse.clientHeight / 2 - currentVerse.parentNode.clientHeight / 2;
        break;
      case 'top':
      default:
        break;
    }
    currentVerse.parentNode.scrollTop =
      currentVerse.parentNode.scrollTop * (1 - tf) + (top + offset) * tf;
  };
  animate({ timing: easeInOut, draw, duration });
};

export const scrollTo = (currentVerse, position) => {
  let offset = 0;
  const top = currentVerse.offsetTop - 12;
  switch (position) {
    case 'center':
      offset = currentVerse.clientHeight / 2 - currentVerse.parentNode.clientHeight / 2;
      break;
    case 'top':
    default:
      break;
  }
  currentVerse.parentNode.scrollTo(0, top + offset);
};

export const switchModeBible = (type, goToBookChapterVerse, setAppConfig) => {
  let curRef = null;
  let appConfig = null;
  try {
    const referenceStr = localStorage.getItem('reference');
    const parsedRef = referenceStr ? JSON.parse(referenceStr) : null;
    curRef = parsedRef && parsedRef[type] ? parsedRef[type] : null;

    const appConfigStr = localStorage.getItem('appConfig');
    const parsedConfig = appConfigStr ? JSON.parse(appConfigStr) : null;
    appConfig = parsedConfig && parsedConfig[type] ? parsedConfig[type] : null;
  } catch (error) {
    // Handle error - curRef and appConfig will remain null
  }
  if (appConfig && curRef) {
    setAppConfig(appConfig);
    goToBookChapterVerse(curRef.bookId, curRef.chapter, curRef.verse);
  }
};

const resetMode = (
  defaultLayout,
  defaultReference,
  currentLanguage,
  setAppConfig,
  setLanguageResources,
  goToBookChapterVerse,
  currentReferenceSelected
) => {
  setAppConfig((prev) => (isEqual(prev, defaultLayout) ? prev : defaultLayout));

  setLanguageResources((prev) => {
    const new_val = cloneDeep(prev);
    defaultLayout.lg.forEach((el) => {
      if (
        !!el.i.split('__')[1]?.split('_')[0] &&
        !new_val.includes(el.i.split('__')[1]?.split('_')[0])
      ) {
        new_val.push(el.i.split('__')[1]?.split('_')[0]);
      }
    });
    return mergeLanguageResources(prev, new_val);
  });

  const nextReference = defaultReference[currentLanguage];
  const shouldNavigate =
    !currentReferenceSelected ||
    currentReferenceSelected.bookId !== nextReference.bookId ||
    String(currentReferenceSelected.chapter) !== String(nextReference.chapter) ||
    String(currentReferenceSelected.verse ?? 1) !== String(nextReference.verse ?? 1);

  if (shouldNavigate) {
    goToBookChapterVerse(
      nextReference.bookId,
      nextReference.chapter,
      nextReference.verse
    );
  }
};

/**
 * A function that resets the value of layouts, resources and reference
 *
 * @param {string} bookId - Current bookId
 * @param {function} setAppConfig - State function that changes appconfig
 * @param {function} goToBookChapterVerse - Function that changes reference
 * @param {string} currentLanguage - current language of app
 * @param {boolean} resetAll reset layouts,reference to default in bible and obs
 *
 */

export const resetWorkspace = ({
  bookId,
  setAppConfig,
  setLanguageResources,
  goToBookChapterVerse,
  currentLanguage,
  currentReferenceSelected,
  resourcesApp: resourcesAppFromState,
  resetAll,
}) => {
  const workspaceType = resetAll ? 'all' : bookId === 'obs' ? 'obs' : 'bible';
  let resourcesApp = Array.isArray(resourcesAppFromState) ? resourcesAppFromState : [];
  if (!resourcesApp.length) {
    try {
      const resourcesAppStr = localStorage.getItem('resourcesApp');
      resourcesApp = resourcesAppStr ? JSON.parse(resourcesAppStr) : [];
    } catch (error) {
      resourcesApp = [];
    }
  }
  const defaultBibleLayout = getDefaultBibleLayout(currentLanguage, resourcesApp);
  const defaultObsLayout = defaultTplOBS[currentLanguage];

  let oldAppConfig = null;
  try {
    const appConfigStr = localStorage.getItem('appConfig');
    oldAppConfig = appConfigStr ? JSON.parse(appConfigStr) : null;
  } catch (error) {
    oldAppConfig = null;
  }
  switch (workspaceType) {
    case 'bible':
      const bibleAppConfig = {
        ...(oldAppConfig || {}),
        [workspaceType]: defaultBibleLayout,
      };
      localStorage.setItem('appConfig', JSON.stringify(bibleAppConfig));
      resetMode(
        defaultBibleLayout,
        defaultBibleReference,
        currentLanguage,
        setAppConfig,
        setLanguageResources,
        goToBookChapterVerse,
        currentReferenceSelected
      );
      break;

    case 'obs':
      const obsAppConfig = {
        ...(oldAppConfig || {}),
        [workspaceType]: defaultObsLayout,
      };
      localStorage.setItem('appConfig', JSON.stringify(obsAppConfig));
      resetMode(
        defaultObsLayout,
        defaultOBSReference,
        currentLanguage,
        setAppConfig,
        setLanguageResources,
        goToBookChapterVerse,
        currentReferenceSelected
      );
      break;
    case 'all':
      const allAppConfig = {
        obs: defaultObsLayout,
        bible: defaultBibleLayout,
      };
      localStorage.setItem('appConfig', JSON.stringify(allAppConfig));
      bookId === 'obs'
        ? resetMode(
            defaultObsLayout,
            defaultOBSReference,
            currentLanguage,
            setAppConfig,
            setLanguageResources,
            goToBookChapterVerse,
            currentReferenceSelected
          )
        : resetMode(
            defaultBibleLayout,
            defaultBibleReference,
            currentLanguage,
            setAppConfig,
            setLanguageResources,
            goToBookChapterVerse,
            currentReferenceSelected
          );
      break;
    default:
      break;
  }
};

export const getLayoutType = (layout) => {
  let type = 'bible';
  layout.forEach((el) => {
    if (el.i.split('__')[1]?.split('_')[1]?.split('-')[0] === 'obs') {
      type = 'obs';
    }
  });
  return type;
};

export const getLanguageIds = () => {
  let oldAppConfig = null;
  try {
    const appConfigStr = localStorage.getItem('appConfig');
    oldAppConfig = appConfigStr ? JSON.parse(appConfigStr) : null;
  } catch (error) {
    oldAppConfig = null;
  }
  let currentLangs = new Set();
  if (oldAppConfig) {
    const allValues = [...Object.values(oldAppConfig)];
    allValues.forEach((value) => {
      value?.lg?.forEach((el) => {
        currentLangs.add(el.i.split('__')[1]?.split('_')[0]);
      });
    });
  }
  currentLangs.add(localStorage.getItem('i18nextLng'));
  return Array.from(currentLangs);
};
const equalNames = (langObj) => {
  const { lang, eng } = langObj;
  if (lang !== eng || eng === '') {
    return eng;
  } else {
    return null;
  }
};
export const packageLangs = (langObj) => {
  if (!langObj) return false;
  const eng = equalNames(langObj);
  if (eng) {
    return `${langObj.lang} (${eng})`;
  } else {
    return langObj.lang;
  }
};
export const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
export const fixUrl = (content) => {
  if (!content) {
    return;
  }
  const links = content.match(/\[{2}\S+\]{2}/g);
  if (!links) {
    return content;
  }
  let contentWithUrl = content;

  links.forEach((el) => {
    const changeUrl = contentWithUrl
      .replace('[[', `[${el.replace(/\[{2}|\]{2}/g, '')}](`)
      .replace(']]', ')');
    contentWithUrl = changeUrl;
  });

  return contentWithUrl;
};
