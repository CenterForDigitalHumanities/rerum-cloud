# API (0.0.1)

- [API](#api)
    - [GET](#get)
        - [Complete Collections](#complete-collections)
            - [Collection Aliases (case insensitive)](#collection-aliases-case-insensitive)
        - [Single Object](#single-object)
    - [POST](#post)
        - [Queries](#queries)
        - [Create](#create)
        - [Batch Create](#batch-create)
    - [PUT](#put)
        - [Update](#update)
        - [Add Properties](#add-properties)
        - [Remove Properties](#remove-properties)
        - [Batch Update](#batch-update)
    - [DELETE](#delete)
    - [Smart objects](#smart-objects)
    - [_rerum](#_rerum)

All the following interactions will take place between
the server running RERUM and the application server. If
you prefer to use the public RERUM server (which I hope
you do), the base URL is `http://rerum.io/api`. All API
calls may throw a `403` for unrecognized applications or
`500` for server errors. For the moment, JSON is the
format for most of the successful responses, but this may
be updated, so the `.json` extension on the calls is helpful.

## GET

### Complete Collections

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:collection.json` | `empty` | 200: JSON \[obj]
| `/collection/:collection.json` | | 404: "Empty Collection"

- **`:collection`**—name of the `type` requested. See the below
for aliases. Example: `/res/canvas.json` returns all `sc:Canvas`
objects. Default limit is 20; send `?limit=INTEGER` to change.

#### Collection Aliases (case insensitive)

The following may all be used interchangeably within API
calls and inside the objects' `type` or `@type` properties.

<dl>
<dt>manifest</dt>
<dd>http://iiif.io/api/presentation/2#manifest</dd>
<dd>sc:manifest</dd>
<dt>sequence</dt>
<dd>http://iiif.io/api/presentation/2#sequence</dd>
<dd>sc:sequence</dd>
<dt>canvas</dt>
<dd>http://iiif.io/api/presentation/2#canvas</dd>
<dd>sc:canvas</dd>
<dd>folio</dd>
<dd>page</dd>
<dt>range</dt>
<dd>http://iiif.io/api/presentation/2#Range</dd>
<dd>structure</dd>
<dt>annotationlist</dt>
<dd>http://iiif.io/api/presentation/2#AnnotationList</dd>
<dd>annotationlist</dd>
<dt>annotation</dt>
<dd>http://www.w3.org/ns/oa#annotation</dd>
<dd>oa:annotation</dd>
<dd>transcription</dd>
<dd>comment</dd>
<dd>line</dd>
</dl>

Returns an entire collection in RERUM groups objects by
`type` or `@type` properties. These groups can be very large
and these calls should be limited. Consider the
[query](#queries) call for a more targeted approach.

### Single Object

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:collection/:id.json` | `empty` | 200: JSON obj
| | | 404: "No record found."

Returns the single record which matches the RERUM-assigned
`@id` string. This is a quicker way to access single objects
without using [query](#queries).

## POST

### Queries

The bulk of any application's interactions with RERUM will be
in the queries. This simple format will be made more complex
in the future, but should serve the basic needs as it is.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/query` | `{JSON}` | 200: JSON [obj]
| | `[{JSON}]` | 404: "No records found"

All responses are in a JSON Array, even if only a single
record is returned. Submissions may be either JSON objects
or Arrays of JSON objects. RERUM will test for property
matches, so `{ "@type" : "sc:Canvas", "label" : "page 46" }` will match

~~~ (json)
{
  "@id": "https://rerum.io/api/res/sc:Canvas/5644406560391168.json",
  "otherContent": [],
  "label": "page 46",
  "width": 730,
  "images": [],
  "height": 1000,
  "@type": "sc:Canvas"
}
~~~

**NB: all object queries must include a `type` or `@type` property.

Advanced queries will be passed directly into the
[GCS runQuery()](https://cloud.google.com/datastore/docs/reference/rest/v1/projects/runQuery)
and are expected to be objects with `query` or `GqlQuery` at their root.
All `type` and `@type` queries are normalized based on the
[aliases](#collection-aliases).

### Create

Add a completely new object to RERUM and receive the location
in response.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:collection` | `{JSON}` | 201: `header.Location` "Created @ `[@id]`
| | | 202: `header.Location` "Updated `[@id]`
| | | 400: "@type mismatch"

Accepts only single JSON objects for RERUM storage. Mints a
new URI and returns the object's location as a header. If the
object already contains an `@id` that matches an object in RERUM,
it will be updated instead, though [update](#update) is preferred
for that use.

The `:collection` parameter is normalized based on the
[aliases](#collection-aliases) and used as a sanity check. If
the `type` or `@type` does not match the indicated `collection`,
a `_collection` property must be included to force the object
into an incongruent `collection`. This parameter is also
capable of creating new collections dynamically, so this helps
prevent simple typos from sending data into strange corners.

### Batch Create

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:collection` | `[{JSON}]` | 200: "`[@id]`"

The array of JSON objects passed in will be created in the
order submitted and the response will have the URI of the new
resource or an error message in the body as an array in the
same order. [Smart objects](#smart-objects) will be handled a
little differently.

The response body will include status and errors as above for
201, 202, 400, etc., but the detail will be much less than a
single request. When errors are encountered, the batch process
will attempt to continue for all submitted items.

## PUT

### Update

Update an existing record through reference to its internal
RERUM id.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:id` | `{JSON}` | 202: `header.Location` "Updated `[@id]`
| | | 400: "Unknown property."
| | | 404: "No record found."

A single object is updated with all properties in the
JSON payload. Unnamed properties are not affected. Unknown
properties throw 400 (use [set](#add-properties)). `@type` will not be normalized
in storage and `@context` for [known types](#collection-aliases)
are filled upon delivery and may be omitted.

When an object is updated, the `@id` will be changed, as the previous
version will maintain its place in the history of that object. To overwrite
the same object, instead of creating a new version, include `?overwrite=true`
in the request. See [Friendly Practices](practices.md) for the rare times when
creating a new entry in the history is not wanted and [Versioning](version.md)
for an explanation of how each object's history is maintained in RERUM.

### Add Properties

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/set/:id` | `{JSON}` | 202: `header.Location` "Updated `[@id]`
| | | 404: "No record found."

A single object is updated by adding all properties in the JSON
payload. If a property already exists, it is overwritten without
feedback.

### Remove Properties

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/unset/:id` | `{JSON}` | 202: `header.Location` "Updated `[@id]`
| | | 404: "No record found."

A single object is updated by dropping all properties
in the JSON payload. If a value is included, it must match
to be dropped.

### Batch Update

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/[res,set,unset]/:id` | `[{JSON}]` | 202: "`[@id]`"

The array of JSON objects passed in will be updated in the
order submitted and the response will have the URI of the
resource or an error message in the body as an array in the
same order. [Smart objects](#smart-objects) will be handled a
little differently. Batch updating has no equivalent `overwrite`
parameter.

The request path will indicate the action and possible errors.
The response body will include status and errors as above for
201, 202, 400, etc., but the detail will be much less than a
single request. When errors are encountered, the batch process
will attempt to continue for all submitted items.

## DELETE

Mark an object as deleted. Deleted objects are not included
in query results.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `res/:id` | `String` | 204
| | | 404: "No record found."

There is no batch `DELETE` planned.

## Smart objects

Known things in RERUM gain superpowers to save the embedded
items and update batches cleverly. To trigger this behavior,
add `?recursive=true` to create or update requests. GET the
new object from the location returned to learn the new URIs
assigned to the embedded entities.

| Object | Behavior
| ---     | ---     | ---
| Manifest  | Also create or update any Canvases, AnnotationLists, or Annotations within.
| Canvas    | Also create or update any AnnotationLists or Annotations within.
| AnnotationLists | Also create or update Annotations within.

In fact, the recursive flag will tell RERUM to traverse any object and look
for these known types to also update, but the standard structure of IIIF
objects means that the action will be much more reliable.

## _rerum

Each object has a private property called `_rerum` containing a metadata
object about the record retreived, such as it exists at the time.

| Property | Type | Description
| ---     | ---     | ---
| history.prime   | String    | The URI of the very top object in this history.
| history.next    | [String]  | An array of URIs for the updated versions of this object. A length > 1 indicates a fork.
| history.previous| String    | The URI of the immediately previous version of this object.
| generatedBy     | String    | Reference to the application whose key was used to commit the object.
| createdAt       | timestamp | Though the object may also assert this about itself, RERUM controls this value.
| isOverwritten   | timestamp | Written when `?overwrite=true` is used. Does not expose the delta, just the update.
| isPublished     | boolean   | Simple reference for queries of the RERUM publishing motivations.

In the future, this may be encoded as an annotation on the object, using 
existing vocabularies, but for now the applications accessing RERUM will
need to interpret these data if it is relevant.

[home](index.md) | [Friendly Practices](practices.md) | [API](api.md) | [Register](register.md)