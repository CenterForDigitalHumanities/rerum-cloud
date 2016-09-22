//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var express = require('express');
var config = require('./config');

var app = express();
app.set('json spaces', 2);
var server = http.createServer(app);

var ds =  require('@google-cloud/datastore');

var dsClient = ds({
  projectId: config.get('GCLOUD_PROJECT'),
  keyFilename: './.auth.json',
  namespace:'rerum'
});

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore (obj) {
  obj.data["@id"] = "https://api-cubap.c9users.io/res/"+obj.data["@type"]+"/"+obj.key.id;
  return obj.data;
}

// Translates from the application's format to the datastore's
// extended entity property format. It also handles marking any
// specified properties as non-indexed. Does not translate the key.
//
// Application format:
//   {
//     id: id,
//     property: value,
//     unindexedProperty: value
//   }
//
// Datastore extended format:
//   [
//     {
//       name: property,
//       value: value
//     },
//     {
//       name: unindexedProperty,
//       value: value,
//       excludeFromIndexes: true
//     }
//   ]
function toDatastore (obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  var results = [];
  Object.keys(obj).forEach(function (k) {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
}

// Lists all of kind in the Datastore.
// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, books, nextPageToken)``.
// [START list]
function list (kind, limit, token, cb) {
  var q = dsClient.createQuery('rerum', kind)
    .limit(limit)
    .start(token);

  dsClient.runQuery(q, function (err, entities, nextQuery) {
    if (err) {
      return cb(err);
    }
    var hasMore = entities.length === limit ? nextQuery.startVal : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}
// [END list]

app.get(['/res/:kind','/collection/:kind'], function(req,res){
  // get all manifests (limit 20 for now)
  list(req.params.kind,20,null,function(err, results){
    if(err){
      return res.err(err);
    }
    if(results.length===0){
      return res.status(404).send('Empty collection.');
    }
    return res.json(results).status(200);
  });
  // TODO: limit by req properties
  
});

app.get('/res/:kind/:id',function(req,res){
  // get anything by id
  var key = dsClient.key([req.params.kind,parseInt(req.params.id)]);
  dsClient.get(key, function(err, entity){
    if(err){
      return res.err(err);
    }
    if(!entity){
      return res.status(404).send('No record found.');
    }
    return res.json(fromDatastore(entity)).status(200);
  });
});

// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use(function (err, req, res, next) {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("server listening at", addr.address + ":" + addr.port);
});
