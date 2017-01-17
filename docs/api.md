# API

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
        - [Remove Properties](#remove-properties)
        - [Batch Update](#batch-update)
    - [DELETE](#delete)

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

- **`:collection`**—name of the `type` requested. See the below for aliases. Example: `/res/canvas.json` returns all `sc:Canvas` objects.

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
matches, so `{ "label" : "page 46" }` will match

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

Advanced queries are not yet supported, but are planned and
are likely to follow MongoDB syntax. All `type` and `@type`
queries are normalized based on the [aliases](#collection-aliases).

### Create

Add a completely new object to RERUM and receive the location
in response.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:collection` | `{JSON}` | 201: `header.Location` "Created @ `[@id]`
| | | 202: `header.Location` "Updating `[@id]`
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

!help wanted: submit array, return location array

## PUT

### Update

Update an existing record through reference to its internal
RERUM id.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/res/:id` | `{JSON}` | 202: `header.Location` "Updated `[@id]`
| | | 404: "No record found."

A single object is updated with all properties in the
JSON payload. Unnamed properties are not affected. New
properties are added. `@type` will not be normalized
in storage and `@context` for [known types](#collection-aliases)
are filled upon delivery and may be omitted.

### Remove Properties

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `/unset/:id` | `{JSON}` | 202: `header.Location` "Updated `[@id]`
| | | 404: "No record found."

A single object is updated by dropping all properties
in the JSON payload. If a value is included, it must match
to be dropped.

### Batch Update

!help wanted: submit array (`res` or `unset`, return location array)

## DELETE

Mark an object as deleted. Deleted objects are not included
in query results.

| Patterns | Payloads | Responses
| ---     | ---     | ---
| `res/:id` | `String` | 204
| | | 404: "No record found."

[home](index.md) | [Friendly Practices](practices.md) | [API](api.md) | [Register](register.md)