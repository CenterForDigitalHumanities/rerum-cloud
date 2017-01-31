/**
 * Allow for requesting of collections by aliases and common prefixes.
 * @param <string> kind The kind of things collected.
 * @returns <string> The kind of the collection in the datastore.
 */
function equivalence(kind) {
    switch (kind.toUpperCase()) {
        case "MANIFEST":
        case "HTTP://IIIF.IO/API/PRESENTATION/2#MANIFEST": kind = "sc:Manifest";
            break;

        case "SEQUENCE":
        case "HTTP://IIIF.IO/API/PRESENTATION/2#SEQUENCE": kind = "sc:Sequence";
            break;

        case "CANVAS":
        case "FOLIO":
        case "PAGE":
        case "HTTP://IIIF.IO/API/PRESENTATION/2#CANVAS": kind = "sc:Canvas";
            break;

        case "RANGE":
        case "STRUCTURE":
        case "HTTP://IIIF.IO/API/PRESENTATION/2#RANGE": kind = "sc:Range";
            break;

        case "ANNOTATIONLIST":
        case "HTTP://IIIF.IO/API/PRESENTATION/2#ANNOTATIONLIST": kind = "sc:AnnotationList";
            break;

        case "ANNOTATION":
        case "TRANSCRIPTION":
        case "COMMENT":
        case "LINE":
        case "HTTP://WWW.W3.ORG/NS/OA#ANNOTATION": kind = "oa:Annotation";
            break;

        default: kind = kind;
    }
    return kind;
}

module.exports = {
    equivalence:equivalence
};

