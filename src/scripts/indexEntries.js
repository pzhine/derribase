/* eslint-disable no-console, no-continue */
import fs from 'fs';
import os from 'os';

import {
  entriesFromMotifs,
  sourcesFromEntries,
  mergeEntries,
  groupEntriesBySource,
  linkMotifsInEntry,
  makeStemDict
} from '../lib/indexers';

import motifDict from '../content/motifs.json';

export default function indexEntries({ path, logPath }) {
  const doc = JSON.parse(fs.readFileSync(`${path}/full.json`));
  const biblio = JSON.parse(fs.readFileSync(`${path}/biblio.json`));

  // get entries by source
  const allSources = sourcesFromEntries(entriesFromMotifs(doc, biblio));
  const sources = allSources;
  // const sources = { BSi: allSources.BSi };

  const t1 = new Date();
  let t2 = t1;
  let entryCount = 0;
  let mergedEntryCount = 0;
  let mergedEntries = [];

  if (logPath) {
    fs.writeFileSync(logPath, '');
  }

  const log = msg => logPath
    ? fs.appendFileSync(logPath, msg + os.EOL)
    : console.log(msg);

  Object.keys(sources).forEach((sid) => {
    log('🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊');
    log(sid);
    log(' ');

    const merged = mergeEntries({
      entryList: sources[sid].entries,
      minCount: 5,
      log
    });
    mergedEntries = mergedEntries.concat(merged);

    log(`Runtime: ${new Date() - t2}`);
    t2 = new Date();

    log(`BEFORE MERGE: ${sources[sid].entries.length} entries`);
    entryCount += sources[sid].entries.length;

    log(`AFTER MERGE: ${merged.length} entries`);
    mergedEntryCount += merged.length;

    log(' ');
  });

  log(`Total Runtime: ${new Date() - t1}`);
  log(`BEFORE MERGE: ${entryCount} entries`);
  log(`AFTER MERGE: ${mergedEntryCount} entries`);

  fs.writeFileSync(`${path}/entries.json`, JSON.stringify(mergedEntries));

  writeSourceJsons({ entries: mergedEntries, path, doc });
}

export function writeSourceJsons({ entries, path, doc }) {
  const stemDoc = makeStemDict(motifDict);
  const entriesBySource = groupEntriesBySource(entries);
  Object.keys(entriesBySource).forEach((sid) => {
    // add linked content
    const sourceEntries = entriesBySource[sid].map(entry => ({
      ...entry,
      linkedContent:
        linkMotifsInEntry({ content: entry.content, stemDoc }).entry
    }));
    fs.writeFileSync(
      `${path}/sources/${sid}.json`,
      JSON.stringify(sourceEntries)
    );
  });
}

if (require.main === module) {
  const path = process.argv[2];
  if (process.argv[3] === '--sources') {
    // only write sources from existing entries.json
    const entries = JSON.parse(fs.readFileSync(`${path}/entries.json`));
    const doc = JSON.parse(fs.readFileSync(`${path}/full.json`));
    writeSourceJsons({ entries, path, doc });
  } else {
    indexEntries({ path, logPath: process.argv[3] });
  }
}
