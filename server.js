//
// # RERUM-cloud
// GCS cloud RERUM API
// LokiPreservatur
//
var http = require('http');
var path = require('path');

var async = require('async');
var express = require('express');
var api = require('./api');
var alias = require('./alias');

var app = express();
app.set('json spaces', 4);
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json

var server = http.createServer(app);

// Routes
app.get(['/res/:kind.json','/collection/:kind.json'], api.getCollection);
app.get('/res/:kind/:id.json', api.jwtCheck, api.getByID);
app.post('/query', api.jwtCheck, api.sendQuery);
app.post('/res/:kind/:kind', api.jwtCheck, api.create);
app.put('/res/:kind/:id', api.jwtCheck,api.update);
app.put('/set/:kind/:id', api.jwtCheck, api.set);
app.put('/unset/:kind/:id', api.jwtCheck, api.unset);
app.delete('/res/:kind/:id', api.jwtCheck, api.delete);

// Auth Check
app.use(api.allowReads); // api.jwtCheck on else
// app.use(['/query', '/update/:id', '/set/:id', '/unset/:id',], api.jwtCheck);
// app.use(api.jwt({
//     secret: api.jwksRsa.expressJwtSecret({
//         cache: true, rateLimit: true, jwksRequestsPerMinute: 5, jwksUri: ''
//     }), 
//     audience: 'http://rerum.io/api',
//     issuer: 'https://cubap.auth0.com/',
//     algorithms: ['RS256']
// }));

app.get('/res', function (req, res) {
    var names = alias.getNames();
    var page = "<!DOCTYPE html><html><head><title>Rerum Cloud</title></head><body>"
        + "<p> Use <code>/res/COLLECTION</code> or <code>/res/COLLECTION/ID</code> format to get item(s).</p>"
        + "<p> Use <code>/query</code> to search through objects.</p>"
        + "<p> Visit <a href='https://centerfordigitalhumanities.github.io/rerum-cloud/api.html'>the API</a> for more.</p>";
    page += "</body></html>";
    res.send(page);
});

// Static in /pages
app.use(express.static('pages'));

// Default Home
app.get('*', function (req, res) {
    var names = alias.getNames();
    var page = "<!DOCTYPE html><html><head><title>Rerum Cloud</title></head><body>"
        + "<p> Nothing here. Maybe look at a collection?</p>";
    var i;
    for (i = 0; i < names.length; i++) {
        page += ("<a href='res/" + names[i] + ".json' >" + names[i] + "</a><br>");
    }
    page += "</body></html>";
    res.send(page);
});

// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// return error message for unauthorized requests
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ message: 'Missing or invalid token' });
    }
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
