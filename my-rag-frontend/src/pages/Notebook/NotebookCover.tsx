import {type FC } from 'react';
import type { Notebook } from '@/types';

interface Props {
  notebook: Notebook;
  compact?: boolean;
}

export const NotebookCover: FC<Props> = ({ notebook, compact }) => {
  const classes = ['notebook-cover', `pattern-${notebook.pattern}`];
  if (compact) classes.push('cover-compact');

  return (
    <div
      className={classes.join(' ')}
      style={{
        backgroundColor: notebook.coverColor,
      }}
    >
      <div className="cover-label">NOTEBOOK</div>
    </div>
  );
};

