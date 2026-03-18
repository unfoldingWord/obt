import React from 'react';

import { Card } from 'translation-helps-rcl';

import USFMContent from './USFMContent';
import useChapterContent from '../../hooks/useChapterContent';

export default function Chapter({
  title,
  classes,
  onClose,
  resource,
  type,
  reference,
  fontSize,
}) {
  const content = useChapterContent({
    reference,
    resource,
  });
  return (
    <Card
      closeable
      onClose={onClose}
      title={title}
      type={type}
      id={type}
      classes={{ ...classes, root: classes.root + ' intro-card' }}
      fontSize={fontSize}
    >
      <USFMContent
        fontSize={fontSize}
        content={content}
        type={type}
        reference={reference}
        languageId={resource.languageId}
      />
    </Card>
  );
}
