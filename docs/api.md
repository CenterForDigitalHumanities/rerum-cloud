var config = require('./config');
var alias = require('./alias');

var ds = require('@google-cloud/datastore');

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const baseURL = "http://localhost:3000";

var dsClient = ds({
    projectId: config.get('GCLOUD_PROJECT'),
    keyFilename: './.auth.json',
    namespace: 'rerum'
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
function fromDatastore(obj) {
    obj.data["@id"] = baseURL + "/res/" + obj.data["@type"] + "/" + obj.key.id + ".json";
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
function toDatastore(obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    var results = [];
    Object.keys(obj).forEach(function(k) {
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
function list(kind, limit, token, cb) {
    var q = dsClient.createQuery('rerum', kind)
        .limit(limit)
        .start(token);

    dsClient.runQuery(q, function(err, entities, nextQuery) {
        if (err) {
            return cb(err);
        }
        var hasMore = entities.length === limit ? nextQuery.startVal : false;
        cb(null, entities.map(fromDatastore), hasMore);
    });
}
// [END list]

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

function collectionMismatch(req, res, ent) {
    if (req.params.kind !== alias.equivalence(ent['@type']) && req.params.kind !== alias.equivalence(ent._collection)) {
        return res.status(400).send("The @type '" + ent['@type'] +
            " does not match the collection (" + req.params.kind + ") to which it is written. " +
            "Please add the _collection property, if you would like to compel the API.");
    }
}
module.exports = {

    names: alias.getNames,

    getCollection: function(req, res) {
        req.params.kind = alias.equivalence(req.params.kind);
        // get all from collection (limit 20 or ?limit)
        var limit = parseInt(req.query.limit) || 20;
        list(req.params.kind, limit, null, function(err, results) {
            if (err) {
                return res.err(err);
            }
            if (results.length === 0) {
                return res.status(404).send('Empty collection.');
            }
            return res.json(results).status(200);
        });
    },

    getByID: function(req, res) {
        // get anything by id
        req.params.kind = alias.equivalence(req.params.kind);
        var key = dsClient.key([req.params.kind, parseInt(req.params.id)]);
        dsClient.get(key, function(err, entity) {
            // TODO: if known object, possibly load subdocuments (like annotations
            // in a list or canvases in a Manifest/sequence)
            if (err) {
                return res.err(err);
            }
            if (!entity) {
                return res.status(404).send('No record found.');
            }
            return res.json(fromDatastore(entity)).status(200);
        });
    },

    sendQuery: function(req, res) {
        // TODO: query with object
        // eg: { for_project : 4080 }
        var q = {
            partitionId: {
                projectId: config.get('GCLOUD_PROJECT'),
                namespaceId: "rerum"
            },
            //     readOptions: {
            //       "readConsistency": "STRONG",
            // "transaction": dsClient.BeginTransaction()
            //             }
        };
        // GCS runQuery() Object 
        if (req.body.query || req.body.GqlQuery) {
            var qtype = Object.keys(req.body)[0];
            q[qtype] = req.body[qtype];
        } else {

            // Simple Object Query
            var limit = parseInt(req.query.limit) || 20;
            var kind = req.body.type || req.body['@type'];
            if (kind) {
                kind = alias.equivalence(kind);
            } else {
                return res.status(400).send('Object queries must specify a type or collection.');
            }
            var gql = (function() {
                var obj = req.body;
                var query = ["SELECT * FROM " + kind + " WHERE"];
                var prop, keys;
                keys = Object.keys(obj);
                while (prop = keys.pop()) {
                    if (prop === "kind" ||
                        prop === "type" ||
                        prop === "@type") {
                        continue;
                    }
                    if (query.length > 2) {
                        query.push("AND");
                    }
                    query.push(prop + "=`" + obj[prop] + "`");
                }
                return query.join(" ");
            })()
            q.GqlQuery = gql;
        }

        dsClient.runQuery(q, function(err, entities) {
            if (err) {
                return err;
            }
            return res.status(200).send(entities.map(fromDatastore));
        });

    },

    create: function(req, res) {
        // create anything
        var key;
        req.params.kind = alias.equivalence(req.params.kind);
        var entities = [];
        var ent;
        if (!Array.isArray(req.body)) {
            // Arrayify if not batch
            req.body = [req.body];
        }
        while (ent = req.body.pop()) {
            collectionMismatch(req, res, ent);
            if (ent['@id']) {
                // id already exists, update instead.
                this.update([ent]);
                continue;
                //     var id = ent['@id'];
                //     var key_id = parseInt(id.substring(id.lastIndexOf("/") + 1));
                //     key = dsClient.key([req.params.kind, key_id]);
            } else {
                // partial key creates a new entry
                key = dsClient.key(req.params.kind);
            }
            ent._rerum = {
                history: {
                    prime: "root",
                    next: null,
                    previous: false
                },
                generatedBy: "TODO", // TODO: get application from key
                createdAt: Date.now()
            };
            if (ent.motivation.indexOf("rr:publishing") +
                ent["oa:hasMotivation"].indexOf("rr:publishing") > -2) {
                ent._rerum.isPublished = true;
            }
            if (ent.motivation.indexOf("rr:unpublishing") +
                ent["oa:hasMotivation"].indexOf("rr:unpublishing") > -2) {
                ent._rerum.isPublished = false;
            }
            entities.push({
                key: key,
                data: ent
            });
            if (req.query.recursive) {
                // TODO: if known object, possibly break out subdocuments (like annotations
                // in a list or canvases in a Manifest/sequence)
                // https://cloud.google.com/datastore/docs/concepts/entities#datastore-key-with-multilevel-parent-nodejs
                console.log("Recursive saving is not yet implemented.");
            }
        }
        dsClient.save(entities, function(err, data) {
            if (err) {
                return res.err(err).send(err.response || "Save failed.");
            }
            var id, at_id;
            if (data.mutationResults[0].key) {
                // New object forced a new id in the key
                id = data.mutationResults[0].key.path[0].id;
                at_id = req.protocol + "://" + req.hostname + req.url + "/" + id + ".json";
                return res.status(201).location(at_id).send("Created @ " + at_id);
            } else { // no change to key
                // updating object, prefer a PUT, this should not happen
                at_id = req.body['@id'];
                return res.status(202).location(at_id).send("Updated " + at_id);
            }
        });
    },

    update: function(req, res) {
        // TODO: update anything or fail to find
        var key;
        req.params.kind = alias.equivalence(req.params.kind);
        var entities = [];
        var ent;
        if (!Array.isArray(req.body)) {
            // Arrayify if not batch
            req.body = [req.body];
        }
        while (ent = req.body.pop()) {
            collectionMismatch(req, res, ent);
            // TODO: apply patch?
        }
    },

    set: function(req, res) {
        // TODO:add props or fail to find
        // maybe this is all in update, or a patch
    },

    unset: function(req, res) {
        // TODO:drop props or fail to find
        // maybe this is all in update, or a patch
    },

    delete: function(req, res) {
        // TODO: delete anything
    },
    // Auth Check
    allowReads: function(req, res, next) {
        if (req.method === "GET") {
            next();
        } else {
            res.send(403, { message: 'Forbidden' });
        }
    },
    jwt: jwt,
    jwtCheck: jwtCheck,
    jwksRsa: jwksRsa
};