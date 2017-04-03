#!/usr/bin/env node --harmony

const cmd = require('commander');
const catalog = require('../dist/catalog');

cmd.parse(process.argv);

const args = cmd.args;

if (args.length < 1) {
  console.error('You must provide a query string.');
  process.exit(1);
}

catalog.createCatalog()
  .then(c => c.search(args[0]))
  .then((rows) => {
    for (const doc of rows) {
      console.log(`${doc.author}, "${doc.title}", "${doc.file}"`);
    }
  })
  .catch((e) => {
    console.log('There was an error:');
    console.error(e);
  });