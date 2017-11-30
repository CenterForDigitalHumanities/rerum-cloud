# Versioning in RERUM

Versioning as it is known in software is simply the process of preserving
previous iterations of an entity when changes are made. There are many systems
available to the developer which differ in centralization, cloning behaviors,
delta encoding, etc., but for the purpose of this API, the philosophy and utility
should suffice.

## What is ?

Versioning is in some ways like different editions of a published work. Even when
the new work supercedes the previous, both are maintained so that they can be cited
reliably and the changes between them may become an interesting piece of the academic
conversation as well. In the digital world, new versions can come quickly and the
differences between them may be quite small. However, in an ecosystem like Linked
Open Data, that presumes most resources are remote and have a permanant and reliable
reference, even small gaps can magnify and create dysfunction.

## Permanent Reference

The idea of a <abbreviation title="Permanent Uniform Resource Locator">PURL</abbreviation>
for *resources* on the Internet is an old one. Most HTML pages for records in a collection
include a "reference URL" or "cite as" which indicates to the user how to reliably return
to the object being viewed. With RERUM, we want to extend the courtesy of a stable home
to `sc:Manifest`, `oa:Annotation`, and similar objects that are more often viewed only
as attached to resources like books, paintings, and other records of "real things."

Upon creation in RERUM, an object (heretofore an annotation, for ease of example) is
minted a novel URI (`@id`, in JSON-LD) where it will always be available. Whenever a
trusted application makes a change, a new version is saved and given a new URI,
connected to the previous annotation. In most cases, the significant changes will be
to the `oa:hasBody` or `oa:hasTarget` fields, but any altered property may make an
existing reference unreliable, so the new URI is returned to the application while 
the old reference remains stable.

## Branches: the family tree of digital objects

In the wide world, it is likely that two or more applications may be referencing and
even updating the same annotation for different reasons. As an example, let's consider
transcription annotations made in a standards-compliant application, such as [T&#8209;PEN](http://t-pen.org),
and [Mirador](http://projectmirador.org), an open viewer for IIIF objects. A museum may
digitize a manuscript and open it up for public transcription, creating many varied
annotations throughout the document, identifying image fragments and text content. In
RERUM, these annotations are not only associated with each other in the Manifest shared
by the museum, but every individual annotation attributes itself to the user who created
it or offered updates. This case for versioning is simple to see and accomodate. 

Now a prestigious paleographer comes along wishing to complete an authoratative edition of
this manuscript. She will begin a project in the transcription application using all of the
annotations that existed at the time. As she goes through and applies corrections and
conventions for expansions and spelling and punctuation, she is updating the annotations,
but in her own project, not that of the public project from the museum. This works because
the museum projects annotations still exist and the references to them have not changed.
If someone else comes in and suggests a change to an annotation for which the paleographer
has already created a more recent version, the history of the annotation branches, allowing
both current versions to share ancestry without collision.

> Created four lines on a page in the museum project:
> ```json
> {A1:Museum1}, {A2:Museum1}, {A3:Museum2}, {A4:Museum1}
> ```
> The paleographer begins work and makes a change on the second line:
> ```json
> {A1:Museum1}, {A2.1:Paleographer1}, {A3:Museum2}, {A4:Museum1}
> ```
> but the museum project remains unchanged.
> 
> When Museum2 corrects an error in Museum1's transcription 
> (cooincidentally the same error the paleographer caught):
> ```json
> {A1:Museum1}, {A2.2:Museum2}, {A3:Museum2}, {A4:Museum1}
> ```
> the public project is updated without breaking the paleographer's edition.
> 
> So the history of A2 looks like this:
> ```monospaced
>             {A2}                created, attributed to Museum1
>             / |
>        {A2.1} |                 {A2} updated by Paleographer1
>           |  {A2.2}             {A2} updated by Museum2
>           ↓   ↓
>     future updates have two options now
> ``` 

Now the model works for everyone. The museum has an open project, the paleographer has a
project she controls, and every contribution through history is automatic. The problem
that has been introduced, however, is how should a Manifest viewer display these annotations?
To show them all in all their versions would quickly overwhelm, but depending on the moment
the "most recent" annotation may be from either fork. Moreover, the paleographer may not
intend for these annotations, though stored in an open repository, to be considered a
finished project, suitable for display or citing. The simplest answer is that a repository
can publish their Manifest with all the intended annotations included, but that undermines
the possibilities of an open store.

## Digital "Micropublishing"

RERUM supports and encourages the use of a few `oa:Motivation`s that have not been used
before. In addition to the Motivation on each well-formed annotation that should indicate
whether it is a transcription, translation, comment, edit, etc. applications may apply
`rr:working` or `rr:releasing`. Not having either of these Motivations means nothing—it
is simply unhelpful, and is the current default of most encoding platforms. The thinking
up to this point has been that annotations would always be sequestered until they are ready
for publication and anything found in the wild is official. Linked Open Data, however, thrives
on connections and the interesting things that can happen when many iotas of half-completed
assertions and descriptions hit critical mass. As a platform, RERUM cannot hide anyone's
work and sincerely commit to open data and interoperable exchange, but it would be foolish
to release users' assertions into the wild knowing that convention assumes these objects
have been imbued with a complete academic soul.

The `rr:working` Motivation is simple. The statement is just that the content of the
annotation (or object) is not intended for publication—it is shared in good faith for use
in discovery or as a seed for further work only. An `rr:working` object is subject to
change (see: [overwriting](#overwrite)) and may be completely reversed, disowned, or deleted
in the future. In some ways, it is just a conversation over coffee, albeit one that
establishes history and maintains full attribution in its encoding.

The `rr:releasing` Motivation is not just the inverse of `rr:working`. It is a full
mark of confidence from the creator and assurance from RERUM that it will be available
at this location in perpetuity. When an application marks something as published, no
changes may be made to it, period. Even if it is deleted, hiding it from discovery, a
resource that had referenced it will continue to find it at that location with a flag
describing it as intended for deletion.

> **NB:** Within RERUM, releasing a smart object, such as a `sc:Manifest` will cascade the
> `isReleased` flag in `__rerum` to all the children it is also updating, unless the application
> has explicitly included a `rr:working` Motivation.

In this way, strange new combinations of publications may arise. A museum may "publish"
their Manifest, offering their imprimatur on the sequences, labels, and descriptions
within. This Manifest may be offered up for crowd-sourced transcription without also
implying that the museum stands behind the evolving transcription data. A scholar who
is working their way through a difficult document can publish a chapter on which he
would like to plant his flag while continuing to work on the rest of the document,
years before publishing the critical edition of the work.

## overwrite

This final option for applications is unique to digital objects and to be used very 
sparingly. By throwing the `?overwrite=true` switch when making an update request,
the application acknowledges that the existing version of the object is flawed or
so irrelevant as to be useless. In this case only, there is no new version made;
the original is updated and the private `__rerum` metadata is updated with the date
of the overwrite. Most cases where this is required, best practices should have handled
it before committing the change, but RERUM acknowledges that human error will
sometimes undermine machine obedience.
