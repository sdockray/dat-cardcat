#!/usr/bin/env node --harmony

const _ = require('lodash');
const cmd = require('commander');
const catalog = require('../dist/catalog');

// List the available collections, as provided by the dats
cmd
  .command('available')
  .action(() => {
    catalog.createCatalog()
      .then(c => c.getAvailableCollections())
      .then((collections) => {
        for (const c of collections) {
          console.log(`${c[1]} - ${c[0]}`);
        }
      });
  });

// Import one of the available collections
cmd
  .command('load [name] [dat]')
  .action((name, dat) => {
    catalog.createCatalog()
      .then(c => c.ingestDatCollection(name, dat))
      .then(() => {
        console.log(`${name} is loaded`);
      });
  });

// Information about one of the available collections
cmd
  .command('info [name] [dat]')
  .action((name, dat) => {
    catalog.createCatalog()
      .then(c => c.informationAboutCollection(name, dat))
      .then((info) => {
        console.log(`Title: ${info.title}\nDescription: ${info.description}`);
      });
  });

// List the authors, by letter, include counts
cmd
  .option('-c, --counts', 'include counts')
  .command('list [filter]')
  .action((filter) => {
    catalog.createCatalog(false, true)
      .then(c => c.getCollections(filter))
      .then((rows) => {
        for (const doc of rows) {
          const cStr = doc.collection.replace(';;', ' -> ');
          if (cmd.counts) {
            console.log(`${cStr} (${doc.count})`);
          } else {
            console.log(`${cStr}`);
          }
        }
      });
  });

// Get authors in a collection
cmd
  .command('author-letters <name>')
  .action((name) => {
    catalog.createCatalog(false, true)
      .then(c => c.getAuthorLetters({ collection: name }))
      .then((rows) => {
        for (const doc of rows) {
          console.log(doc.letter);
        }
      });
  });

// Get authors in a collection
cmd
  .option('-d, --dats', 'show dat keys')
  .command('authors <name>')
  .action((name) => {
    catalog.createCatalog(false, true)
      .then(c => c.getAuthors(null, { collection: name, sort: ['author_sort', 'asc'] }))
      .then((rows) => {
        for (const doc of rows) {
          if (cmd.counts) {
            console.log(`${doc.author} (${doc.count})`);
          } else {
            console.log(`${doc.author}`);
          }
        }
      });
  });

// Get titles in a collection
cmd
  .option('-d, --dats', 'show dat keys')
  .command('titles <name> [author]')
  .action((collection, author) => {
    catalog.createCatalog(false, true)
      .then(c => c.getTitlesWith({ collection, author, sort: ['weight', 'asc'] }))
      .then((rows) => {
        // const sorted = _.sortBy(rows, 'weight');
        for (const doc of rows) {
          console.log(`${doc.author}: ${doc.title} (${doc.weight})`);
        }
      });
  });

// Checkout a collection
cmd
  .option('-d, --dats', 'show dat keys')
  .command('checkout <name> [author]')
  .action((name, author) => {
    catalog.createCatalog()
      .then(c => c.checkout({ collection: name, author }))
      .finally(() => console.log('Finished downloading...'));
  });

// Finally...
cmd.parse(process.argv);
