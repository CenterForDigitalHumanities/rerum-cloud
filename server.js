//
// # RERUM-cloud
// GCS cloud RERUM API
// LokiPreservatur
//
var http = require('http');
var path = require('path');

var async = require('async');
var express = require('express');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
var api = require('./api');
var alias = require('./alias');

var app = express();
app.set('json spaces', 4);
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json

var server = http.createServer(app);

// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
const jwtCheck = jwt({
    // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cubap.auth0.com/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: 'WSCfCWDNSZVRQrX09GUKnAX0QdItmCBI',
    issuer: `https://cubap.auth0.com/`,
    algorithms: ['RS256']
});

// Auth Check
app.use(['/query', '/res/:id', '/set/:id', '/unset/:id',], jwtCheck);

// Routes
app.get(['/res/:kind.json','/collection/:kind.json'], api.getCollection);
app.get('/res/:kind/:id.json', api.getByID);
app.post('/query', api.sendQuery);
app.post('/res/:kind', api.create);
app.put('/res/:id',api.update);
app.put('/set/:id', api.set);
app.put('/unset/:id', api.unset);
app.delete('/res/:id', api.delete);

app.get('/res', function (req, res) {
    var names = alias.getNames();
    var page = "<!DOCTYPE html><html><head><title>Rerum Cloud</title></head><body>"
        + "<p> Use <code>/res/COLLECTION</code> or <code>/res/COLLECTION/ID</code> format to get item(s).</p>"
        + "<p> Use <code>/query</code> to search through objects.</p>"
        + "<p> Visit <a href='https://centerfordigitalhumanities.github.io/rerum-cloud/api.html'>the API</a> for more.</p>";
    page += "</body></html>";
    res.send(page);
});

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
