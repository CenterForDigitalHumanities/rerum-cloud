# RERUM GCS

Reconditorium Eximium Rerum Universalium Mutabiliumque for
Google Cloud Services
![logo](https://centerfordigitalhumanities.github.io/rerum-consortium/logo.png)

## An Open Exchange

This application (RERUM for short) provides an open repository for the storage of
annotations and abstract objects related to Digital Humanities and
Cultural Heritage studies. Use of this repository is voluntary and
without warranty, but all efforts towards continued support and
open access are made. At the moment, this repository is supported
entirely by the Walter J. Ong, SJ Center for Digital Humanities at
Saint Louis University. This project is open for contribution or
cloning on
[github.com](https://github.com/CenterForDigitalHumanities/rerum-cloud).
All data submitted to RERUM is technically open and discoverable, but
is not required to be interesting. GCS Datastore is an object/document
NoSQL-style database with no enforced schema, but JSON-LD would be nice.

## Authorization and Use

In the spirit of openness, RERUM
absolutely trusts registered applications, but does not independently
authenticate clients. Once an application is [registered](#api), the
API key becomes the path to verification. As the repository and her
associated tools mature, it will become simpler to filter results by
trusted groups, though in most cases, applications will find only the
objects for which they are looking.

### Friendly-Practices

While your application may do whatever is best for your own use, there
are a few suggestions to make your information discoverable, readable,
and perhaps more interesting to others:

#### Object types

RERUM prefers to store [OAC](http://openannotation.org/) and
[IIIF](http://iiif.io/) objects when possible. Specific tools built in
the future will focus on managing these types of objects. New support
will be added as standards are created for non-image object types.
You will see in the [equivalency table](#et) that RERUM primarily expects
Manifests, Sequences, Canvases, and Annotations.

Resources, such as audio, images, text files, 3D models, etc. should be
referred to in the annotations, but stored by a repository more
appropriate for their hosting and conservation. RERUM is not intended
to be your complete database and is not suitable for sensitive user
data, passwords, or large blobs.

#### Private and Reserved Attributes

Applications using RERUM should expect that other applications may have
placed "private" attributes on some objects as a shortut or
application-specific property. These should be used sparingly and removed
before saving or updating whenever possible. Please lead with `_underscore`
and consider if your property should be `_rr_namespaced` to avoid collision.
Similarly, expect that common contexts will be used and names
like `@context` and `resources` may lead to irrelevant discovery or
unintentional over-writing by others.

#### Vocabularies

If possible, use a well trod vocabulary for your data and include a
reference to a context file in your objects. If your application is
generating data that may be best understood in several vocabularies,
feel free to let your robots proliferate annotations describing the
`date` (for example) in ways beyond your local use, for the purpose
of improving discoverability.

#### Versioning

RERUM allows an application to bypass the typical versioning that maintains
the history of an annotation, but this should be used rationally. If a
change really is an insignificant update (such as saving as a user types
in a short input), consider holding the API call until a sync cycle when
your application is more sure of the user's commitment to their annotation.
More information about versioning is available in the
[API documentation](#API).