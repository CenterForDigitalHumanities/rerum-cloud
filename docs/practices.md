# Friendly-Practices

While your application may do whatever is best for your own use, there
are a few suggestions to make your information discoverable, readable,
and perhaps more interesting to others:

## Object types

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

## Private and Reserved Properties

Applications using RERUM should expect that other applications may have
placed "private" properties on some objects as a shortut or
application-specific property. These should be used sparingly and removed
before saving or updating whenever possible. Please lead with `_underscore`
and consider if your property should be `_rr_namespaced` to avoid collision.
Similarly, expect that common contexts will be used and names
like `@context` and `resources` may lead to irrelevant discovery or
unintentional over-writing by others.

## Vocabularies

If possible, use a well trod vocabulary for your data and include a
reference to a context file in your objects. If your application is
generating data that may be best understood in several vocabularies,
feel free to let your robots proliferate annotations describing the
`date` (for example) in ways beyond your local use, for the purpose
of improving discoverability.

## Versioning

RERUM allows an application to bypass the typical versioning that maintains
the history of an annotation, but this should be used rationally. If a
change really is an insignificant update (such as saving as a user types
in a short input), consider holding the API call until a sync cycle when
your application is more sure of the user's commitment to their annotation.
More information about versioning is available in the
[API documentation](#API).

[home](index.md) | [Friendly Practices](practices.md) | [API](api.md) | [Register](register.md)