import Dropbox from 'dropbox';
import fs from 'fs';
import docToJson from '../scripts/docToJson';

export async function docLastModified() {
  const dropbox = new Dropbox({ accessToken: process.env.DBX });
  const res = await dropbox.filesListRevisions({
    path: '/Baby Daddy/BBDD.rtf'
  });
  return new Date(res.entries[0].client_modified);
}

export async function downloadDoc() {
  const dropbox = new Dropbox({ accessToken: process.env.DBX });
  const rtf = await dropbox.filesDownload({
    path: '/Baby Daddy/BBDD.rtf'
  });
  fs.writeFileSync('./BBDD.rtf', rtf.fileBinary);
}

export async function processDoc() {
  await docToJson({ input: './BBDD.rtf', output: './public/full.json' });
  console.log('PROCESS DOC');
}

export async function checkAndProcessDoc(lastModified) {
  const newLastMod = await docLastModified();
  if (lastModified === null) {
    return newLastMod;
  }
  console.log('CURRENT MODIFIED', lastModified);
  console.log('NEW MODIFIED', newLastMod);
  if (lastModified !== newLastMod) {
    await downloadDoc();
    return newLastMod;
  }
  return lastModified;
}
