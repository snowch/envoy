# Cloudant Envoy (beta)

[![Build Status](https://travis-ci.org/cloudant-labs/envoy.svg)](https://travis-ci.org/cloudant-labs/envoy.svg) [![npm version](https://badge.fury.io/js/cloudant-envoy.svg)](https://badge.fury.io/js/cloudant-envoy)

## Beta software

Note: this is beta; it's not battle tested or supported in any way. If you find bugs (of which there will be plenty), do let us know – or better, consider a pull request. You know what beta means, right?

## Introduction

### Why use Envoy?

Database-per-user is a common pattern with CouchDB when there is a requirement for each application user to have their own set of documents which can be synced (e.g. to a mobile device or browser). On the surface, this is a good solution - Cloudant handles a large number of databases within a single installation very well. However, there are some problems.  See [here](./README_WHY_ENVOY.md) for more info when to use Cloudant Envoy.

### What is Envoy?

Cloudant Envoy is a microservice that acts as a replication target for your [PouchDB](https://pouchdb.com/) web app or [Cloudant Sync](https://cloudant.com/product/cloudant-features/sync/)-based native app. Envoy allows your client side code can adopt a "one database per user" design pattern, with a copy of a user's data stored on the mobile device and synced to the cloud when online, while invisibly storing all the users' data in one large database. This prevents the proliferation of database that occurs as users are added and facilitates simpler backup and server-side reporting.

Envoy implements a subset of the CouchDB API and can be used as a replication target for PouchDB or Cloudant Sync, or used with custom replicators such as [pouchdb-envoy](https://www.npmjs.org/package/pouchdb-envoy). 

The diagram below shows a high level overview of Envoy:

![Envoy Overview](./docs/envoy_overview.png)

This diagram shows how a mobile application would typically interact with Envoy:


![Envoy Sequence](./docs/envoy_sequence.png)


## Installation

There are a few ways to get started with Envoy:

### Deploy to Bluemix - suitable for quick

Deploy *Cloudant Envoy* to Bluemix by clicking the **Deploy to Bluemix** button below.

[![Deploy to Bluemix](https://deployment-tracker.mybluemix.net/stats/34c200255dfd02ea539780bb433da951/button.svg)](https://bluemix.net/deploy?repository=https://github.com/cloudant-labs/envoy)

**Don't have a Bluemix account?** If you haven't already, you'll be prompted to sign up for a Bluemix account when you click the button.  Sign up, verify your email address, then return here and click the the **Deploy to Bluemix** button again. Your new credentials let you deploy to the platform and also to code online with Bluemix and Git. If you have questions about working in Bluemix, find answers in the [Bluemix Docs](https://www.ng.bluemix.net/docs/).

**Note**:some CouchDB features which are not yet in an official release. A Cloudant account attained through Bluemix will by default not be compatible. You will need to request that the account be moved to the Cloudant cluster "Porter" with an email to `support@cloudant.com` stating your account name.

### Via npm

Cloudant Envoy is published to npm. It can be installed and run if you have Node.js and npm installed:

```sh
npm install -g envoy
export COUCH_HOST='https://key:passwd@account.cloudant.com'
envoy
```


### Manual installation

To install the code yourself, clone the repo and run `npm install`. The Envoy server needs admin credentials for the backing Cloudant database, and it expects a `COUCH_HOST` environment variable to be set:

```bash
export COUCH_HOST='https://key:passwd@account.cloudant.com'
```

After those variables are set, you can start the Envoy server with `npm start`. Note that the port is the port that Envoy will listen to, not the port of the Cloudant server.

## Configuration

### Environment variables

* PORT - the port number Envoy will listen on. When running in Bluemix, Envoy detects the Cloud Foundry port assigned to this app automatically. When running locally, you'll need to provide your own e.g. `export PORT=8001`
* COUCH_HOST - The URL of the Cloudant service to connected to. Not required in Bluemix, as the attached Cloudant service is detected automatically. `COUCH_HOST` is required when running locally e.g. `export COUCH_HOST='https://key:passwd@account.cloudant.com'`
* ENVOY_DATABASE_NAME - the name of the Cloudant database to use. Defaults to `envoy`
* LOG_FORMAT - the type of logging to output. One of `combined`, `common`, `dev`, `short`, `tiny`, `off`. Defaults to `off`. (see https://www.npmjs.com/package/morgan)
* DEBUG - see debugging section
* ENVOY_AUTH - which authentication plugin to use. One of `default`, `couchdb_user`
* ENVOY_ACCESS - which access control plugin to use. One of `default`, `id`, `meta`
* PRODUCTION - when set to 'true', disables the `POST /_adduser` endpoint

## Using Envoy in your own app

You can install Envoy and run it from your own Node.js application by install the module:

```sh
npm install --save cloudant-envoy
```

And then "require" it into your app:

```js
    var envoy = require('cloudant-envoy')();
```

where it will pick up its configuration from environment variables. You may also pass in object to Envoy on startup with your runtime options e.g.:

```js
    var opts = {
      couchHost: 'http://username:password@mycluster.cloudant.com',
      databaseName: 'myenvoy',
      port: 9000,
      logFormat: 'dev',
      production: true
    };
    var envoy = require('cloudant-envoy')(opts);
    envoy.events.on('listening', function() {
      console.log('[OK]  Server is up');
    });
```

### Sessions

By default Envoy uses the [Express Session](https://github.com/expressjs/session) session handler. This is an in-memory store and is only designed for test deployments. If you want to use any of the [compatible session stores](https://github.com/expressjs/session#compatible-session-stores) you may pass in a `sessionHandler` option at startup e.g.:

```js
    var session = require('express-session');
    var RedisStore = require('connect-redis')(session);
    var options = {
      url: 'redis://127.0.0.1:6379/0'
    };
    var sessionHandler = session({
      store: new RedisStore(options),
      secret: 'oh my'
    });
    var opts = {
      sessionHandler :sessionHandler,
      port: 9000
    };
    var envoy = require('../envoy/app.js')(opts);
```

## Debugging

Debugging messages are controlled by the `DEBUG` environment variable. To see detailed debugging outlining the API calls being made between Envoy and Cloudant then set the `DEBUG` environment variable to `cloudant,nano` e.g

```bash
export DEBUG=cloudant,nano
node app.js
```

or

```bash
DEBUG=cloudant,nano node app.js
```

## Envoy API end points

Envoy supports a subset of the [CouchDB API](http://docs.couchdb.org/en/1.6.1/api/), sufficient to support replication. Additionally, a new Envoy-specific endpoint `_add_user` is there to facilitate testing; see below.


| Replication         | CRUD          | Utility        |
|-------------------  |---------------|--------------  |
| GET /db/_all_docs   | GET /db/id    | POST /_adduser |
| POST /db/_all_docs  | POST /db      | GET /_auth     |
| POST /db/_bulk_docs | POST /db/id   | GET /_logout   |
| POST /db/_bulk_get  | PUT /db/id    | OPTIONS /*     |
| GET /db/_bulk_get   | DELETE /db/id |                |
| GET /db/_changes    | GET /         | *Search*       |
| POST /db/_revs_diff | GET /db       | POST /db/_find |

## Envoy-specic APIs

### GET /_auth

Allows a remote client to either check whether it is logged in or to establish a login session:

```sh
// not logged in - Envoy returns 403 response
> curl https://myenvoy.mybluemix.net/_auth
// log in - Envoy returns 200 response and saves cookie
> curl https://myenvoy.mybluemix.net/_auth --user glynn:password
{"loggedin":true,"username":"glynn"}
```

### GET /_logout

Allows a remote client to logout of a session.

```sh
> curl https://myenvoy.mybluemix.net/_logout
```

### POST /_adduser

Allows the creation of new Envoy users. Supply a `username` and `password` parameter in a form-encoded post e.g.

```sh
curl -X POST -d 'username=rita&password=password' https://myenvoy.mybluemix.net/_adduser
```

This API is only for evaluation purposes and should be disabled in production, by setting the `PRODUCTION` environment variable.

## Plugins

At startup, *Envoy* can load in plugin modules to modify Envoy's behaviour. The plugin source code can be found in the `lib/plugins` directory, with two plugin types supported:

* `auth` – controls how authentication occurs in Envoy.
* `access` – controls how the ownership of a document is stored.

### Default auth plugin

The `default` auth plugin uses the `envoyusers` database to store a database of users who are allowed to authenticate. Add a user to your `envoyusers` database with a document like this:

```js
{
  "_id": "glynn",
  "_rev": "1-58bbb25716001c681febaccf6d48a9b8",
  "type": "user",
  "name": "glynn",
  "roles": [],
  "username": "glynn",
  "salt": "monkey",
  "password": "9ef16a44310564ecd1b6894c46d93c58281b07af"
}
```

Where the `password` field is the `sha1` of the "salt" field concatenated with the user's password e.g. 

```js
    > sha1('monkey' + 'password')
    '9ef16a44310564ecd1b6894c46d93c58281b07af'
```

Additional plugins can be selected using the `ENVOY_AUTH` environment variable. e.g. a value of "couchdb_user" will use the CouchDB "_users" database.

### Default access plugin

The `default` access plugin stores the ownership of a document in the `_id` field of the document. If the owner of the document is `glynn`, then a document whose `_id` is `test` will actually get stored with an `_id` of 

`3d07659e67fa5a86a06945ec4cdb2754c9fc67bf-test` 

where 

`3d07659e67fa5a86a06945ec4cdb2754c9fc67bf` 

is the `sha1` hash of the username.

The replication client doesn't see this additional meta data – it is transparently added and stripped out on its way through Envoy – but it allows Envoy to efficiently store many users data in the same database and retrieve the data each user owns efficiently.

Additional plugins can be selected using the `ENVOY_ACCESS` environment variable.

## Frequently Asked Questions

## Help!

If you have an issue with Envoy, then please check to see if someone else has raised it already in our [issues page](https://github.com/cloudant-labs/envoy/issues). Please [raise an issue](https://github.com/cloudant-labs/envoy/issues/new) for any problems you encounter and we'll see if we can help.

## Links

* [source code](https://github.com/cloudant-labs/envoy)
* [wiki](https://github.com/cloudant-labs/envoy/wiki)
