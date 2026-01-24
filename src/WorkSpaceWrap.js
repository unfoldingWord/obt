import React, { useContext, useEffect, useMemo } from 'react';

import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Workspace } from 'resource-workspace-rcl';

import { AppContext, ReferenceContext } from './context';
import { Card, CardSettings } from './components';

import { columns } from './config/base';
import { getLayoutType } from './helper';

import useStyles from './style';
import { useOccurrence } from '@texttree/tn-quote';

const breakpoints = { lg: 900, md: 700, sm: 500 };

export default function WorkSpaceWrap() {
  const {
    state: { appConfig, resourcesApp, resources, breakpoint, quote, occurrence },
    actions: { setAppConfig, setBreakpoint, setSelections },
  } = useContext(AppContext);
  const { t } = useTranslation();
  const {
    state: {
      referenceSelected: { bookId, chapter, verse },
    },
    actions: { applyBooksFilter },
  } = useContext(ReferenceContext);

  const _selections = useOccurrence({
    book: bookId,
    chapter,
    verses: [verse],
    quotes: [{ quote, occurrence: parseInt(occurrence) }],
  });
  useEffect(() => {
    setSelections(_selections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(_selections)]);

  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  // Deep clone the layout to ensure react-grid-layout detects changes in React 18
  const layout = useMemo(() => {
    const cloned = {};
    for (const key in appConfig) {
      if (Array.isArray(appConfig[key])) {
        cloned[key] = appConfig[key].map((item) => ({ ...item }));
      } else {
        cloned[key] = appConfig[key];
      }
    }
    return cloned;
  }, [appConfig]);

  // Calculate the number of cards for use as a key to force re-render
  const cardCount = useMemo(() => {
    return appConfig?.[breakpoint.name]?.length ?? 0;
  }, [appConfig, breakpoint.name]);

  const layoutRows = useMemo(() => {
    const activeLayout = layout?.[breakpoint.name] ?? [];
    if (!activeLayout.length) {
      return 12;
    }
    const maxRows = activeLayout.reduce((max, item) => {
      const itemBottom = (item?.y ?? 0) + (item?.h ?? 0);
      return Math.max(max, itemBottom);
    }, 0);
    return Math.max(maxRows, 12);
  }, [layout, breakpoint.name]);

  const onLayoutChange = (newLayout, _newLayout) => {
    let oldAppConfig = null;
    try {
      const appConfigStr = localStorage.getItem('appConfig');
      oldAppConfig = appConfigStr ? JSON.parse(appConfigStr) : null;
    } catch (error) {
      oldAppConfig = null;
    }
    const type = getLayoutType(newLayout);
    const newAppConfig = {
      ...(oldAppConfig || {}),
      [type]: _newLayout,
    };
    localStorage.setItem('appConfig', JSON.stringify(newAppConfig));
    setAppConfig(newAppConfig[type]);
  };

  const mainResources = resourcesApp
    .filter((resource) =>
      (appConfig[breakpoint.name] || [])
        .map((item) => item.i)
        .includes(resource.owner + '__' + resource.name)
    )
    .filter((resource) =>
      [
        'Open Bible Stories',
        'Bible',
        'Aligned Bible',
        'Hebrew Old Testament',
        'Greek New Testament',
      ].includes(resource.subject)
    );

  const compareMaterials = (resources, type) => {
    return (
      (resources.length >= 1 &&
        !resources.map((e) => e.owner + '__' + e.name).includes(type)) ||
      (resources.length > 1 &&
        resources.map((e) => e.owner + '__' + e.name).includes(type))
    );
  };

  const onClose = (index, force = false) => {
    if (force || compareMaterials(mainResources, index)) {
      setAppConfig((prev) => {
        const next = { ...prev };
        for (let k in next) {
          next[k] = next[k].filter((el) => el.i !== index);
        }

        return next;
      });
    } else {
      enqueueSnackbar(t('Close_last_resource'), { variant: 'warning' });
    }
  };

  const cards = (appConfig[breakpoint.name] ?? []).map((item) =>
    item.i === 'projector' ? (
      <CardSettings key={item.i} classes={classes} />
    ) : (
      <Card
        key={item.i}
        classes={classes}
        onClose={(event, force = false) => onClose(item.i, force)}
        type={item.i}
      />
    )
  );

  const availableBookList = useMemo(() => {
    const newBookList = [];
    if (bookId === 'obs') {
      newBookList.push('obs');
    } else {
      if (resources.length > 0) {
        resources.forEach((resource) => {
          if (resource.projects) {
            resource.projects.forEach((project) => {
              if (!newBookList.includes(project.identifier)) {
                newBookList.push(project.identifier);
              }
            });
          }
        });
      }
    }
    return newBookList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.length, bookId]);

  useEffect(() => {
    applyBooksFilter(availableBookList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableBookList]);

  const onBreakpointChange = (name, cols) => {
    setBreakpoint({ name, cols });
  };
  return (
    <>
      <Workspace
        key={`workspace-${cardCount}`}
        gridMargin={[1, 1]}
        autoResize={true}
        totalGridUnits={12}
        classes={classes}
        layout={layout}
        breakpoints={breakpoints}
        rows={layoutRows}
        correctHeight={64}
        onBreakpointChange={onBreakpointChange}
        onLayoutChange={onLayoutChange}
        columns={columns}
      >
        {cards}
      </Workspace>
    </>
  );
}
