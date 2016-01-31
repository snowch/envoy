/* global PouchDB */
/* jshint -W079 */
'use strict';

var chance = require('chance')(),
  urllib = require('url'),
  _ = require('underscore'),
  PouchDB = require('pouchdb'),
  env = require('../lib/env.js'),
  request = require('request'),
  init = require('../lib/init.js');

var testUtils = {};

// Delete specified databases
testUtils.cleanup = function (dbs, done) {
  var e = env.getCredentials();

  var num = dbs.length;

  var finished = function(err, resp) {
    if (--num === 0) {
      done();
    }
  };

  dbs.forEach(function(db) {
    new PouchDB(db).destroy(finished, finished);
  });
};


testUtils.url = function(user, password) {
  var e = env.getCredentials();
  return urllib.format({
    protocol: 'http',
    auth: user + ':' + password,
    host: e.url,
    pathname: 'mbaas'
  });
};


testUtils.makeDocs = function(count) {
  var docs = [];
  for (var i=0; i<count; i++) {
    docs.push({
      jobid: chance.guid(),
      description: chance.paragraph({sentences: 2}),
      client: {
        firstname: chance.first(),
        lastname: chance.last(),
        address: chance.address(),
        city: chance.city(),
        state: chance.state({full: true}),
        phone: chance.phone(),
        zip: chance.zip(),
        email: chance.email()
      }
    });
  }

  return docs;
};

testUtils.makeDocName = function() {
  return 'test_doc_' + new Date().getTime();
};

module.exports = testUtils;
