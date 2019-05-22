import React from 'react';
import Entry from './EntryContainer';

const Entries = ({
  entries,
  path,
  highlight,
  showRepeats,
  inlineHead,
  setScroll,
  isLinked,
  showMotifNav,
}) => {
  let lastLocations = null;
  let locationCount = 0;

  return entries.map((entry, idx) => {
    if (lastLocations && entry.locations.low === lastLocations.low) {
      locationCount += 1;
    } else {
      locationCount = 0;
    }
    entry.locations.repeat =
      lastLocations && entry.locations.raw === lastLocations.raw;
    lastLocations = entry.locations;
    return (
      <Entry
        key={entry.id}
        entry={entry}
        content={isLinked ? entry.linkedContent : entry.content}
        highlight={highlight}
        path={path}
        cardinal={locationCount}
        showRepeats={showRepeats}
        inlineHead={idx ? null : inlineHead}
        setScroll={setScroll}
        scrollPos={idx}
        showMotifNav={showMotifNav}
      />
    );
  });
};

export default Entries;
