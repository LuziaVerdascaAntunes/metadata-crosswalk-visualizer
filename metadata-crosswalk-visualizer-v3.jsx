import { useState, useEffect, useRef } from "react";

const C = {
  // Brand palette v1.2
  dark:      "#1a0905",  // Coffee-bean — The Ink / body text
  mid:       "#2e1008",  // Coffee-bean darkened — header surfaces
  primary:   "#4c050d",  // Night-bordeaux — interactive, links, focus
  accent:    "#94b1c8",  // Powder-blue — highlights, CTAs, active states
  surface:   "#e3dfce",  // Bone — The Canvas / light content surface
  // Derived
  card:      "#ede9d8",  // Bone lighter — card backgrounds
  textBody:  "#5c4840",  // Warm muted mid-tone
  textMuted: "#8c7a70",  // Light warm muted — captions
  border:    "#d6d1be",  // Bone-dk — borders
  // Functional semantics (data visualisation, not brand)
  exact:     "#4A7C59",
  partial:   "#94b1c8",  // powder-blue — intentional parallel to accent
  lossy:     "#8B2E2A",
  noMatch:   "#8c7a70",  // same as textMuted
  espresso:  "#532623",  // real-world examples accent
};

const MATCH = {
  exact: { label: "Exact", color: C.exact, icon: "●" },
  partial: { label: "Partial", color: C.partial, icon: "◐" },
  lossy: { label: "Lossy", color: C.lossy, icon: "○" },
  none: { label: "No equivalent", color: C.noMatch, icon: "—" },
  contextual: { label: "Context-dependent", color: C.accent, icon: "◑" },
};

const STANDARDS = [
  { id: "unimarc", label: "UNIMARC", sub: "IFLA International Standard" },
  { id: "marc21", label: "MARC 21", sub: "LC / International" },
  { id: "dc", label: "Dublin Core", sub: "Simple & Qualified" },
  { id: "rda", label: "RDA", sub: "Resource Description & Access" },
  { id: "bibframe", label: "BIBFRAME 2.0", sub: "Library of Congress" },
];

const CLASSIFICATIONS = [
  { id: "sab", label: "SAB", sub: "Klassifikationssystem för svenska bibliotek" },
  { id: "ddc", label: "DDC", sub: "Dewey Decimal Classification" },
  { id: "udc", label: "UDC", sub: "Universal Decimal Classification" },
];

const CONCEPTS = [
  {
    id: "title",
    label: "Title",
    group: "descriptive",
    icon: "T",
    mappings: {
      unimarc: {
        field: "200 $a",
        label: "Title proper",
        match: "exact",
        note: "200 $a for title proper, $e for subtitle (parallel structure to MARC 21 245 $b), $d for parallel titles in other languages. IFLA standard requires transcription from the prescribed source of information. $h/$i for part numbering/naming.",
        indicators: [
          { pos: "1", label: "Title significance", values: "0 = Not significant; 1 = Significant (generates added entry)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Title proper (NR)" },
          { code: "$b", desc: "General material designation (NR)" },
          { code: "$c", desc: "Title proper by another author (R)" },
          { code: "$d", desc: "Parallel title proper (R)", note: "Titles in other languages" },
          { code: "$e", desc: "Other title information (R)", note: "Subtitle" },
          { code: "$f", desc: "First statement of responsibility (NR)" },
          { code: "$g", desc: "Subsequent statement of responsibility (R)" },
          { code: "$h", desc: "Number of a part (R)" },
          { code: "$i", desc: "Name of a part (R)" },
        ],
      },
      marc21: {
        field: "245 $a, $b",
        label: "Title statement",
        match: "exact",
        note: "245 $a for title proper, $b for remainder of title. Related fields: 210 (Abbreviated Title, R), 222 (Key Title, R), 240 (Uniform Title, NR), 242 (Translation of Title, R), 243 (Collective Uniform Title, NR), 246 (Varying Form of Title, R), 247 (Former Title, R).",
        indicators: [
          { pos: "1", label: "Title added entry", values: "0 = No added entry; 1 = Added entry" },
          { pos: "2", label: "Nonfiling characters", values: "0-9 (number of characters to skip for filing)" },
        ],
        subfields: [
          { code: "$a", desc: "Title (NR)" },
          { code: "$b", desc: "Remainder of title (NR)", note: "Subtitle and parallel titles" },
          { code: "$c", desc: "Statement of responsibility (NR)" },
          { code: "$f", desc: "Inclusive dates (NR)" },
          { code: "$g", desc: "Bulk dates (NR)" },
          { code: "$h", desc: "Medium [GMD] (NR)" },
          { code: "$k", desc: "Form (R)" },
          { code: "$n", desc: "Number of part/section (R)" },
          { code: "$p", desc: "Name of part/section (R)" },
          { code: "$s", desc: "Version (NR)" },
        ],
      },
      dc: {
        field: "dc:title",
        label: "Title",
        match: "lossy",
        note: "All title types collapse into one flat dc:title. Qualified DC adds dcterms:alternative but still loses the structured relationship between title/subtitle/parallel titles.",
        elements: [
          { code: "dc:title", desc: "A name given to the resource" },
          { code: "dcterms:alternative", desc: "An alternative name (Qualified DC only)" },
        ],
      },
      rda: {
        field: "RDA 2.3.2",
        label: "Title proper",
        match: "exact",
        note: "RDA provides granular title elements that map cleanly to and from MARC. Title proper is a core element.",
        elements: [
          { code: "2.3.2", desc: "Title proper (Core element)" },
          { code: "2.3.3", desc: "Parallel title proper" },
          { code: "2.3.4", desc: "Other title information (subtitle)" },
          { code: "2.3.5", desc: "Parallel other title information" },
          { code: "2.3.6", desc: "Variant title" },
          { code: "2.3.7", desc: "Earlier title proper (serials)" },
          { code: "2.3.8", desc: "Later title proper (serials)" },
          { code: "2.3.9", desc: "Key title (serials)" },
        ],
      },
      bibframe: {
        field: "bf:Title / bf:mainTitle",
        label: "Title resource",
        match: "exact",
        note: "BIBFRAME models Title as a separate resource with typed properties. Structurally richer than MARC — supports linking and round-tripping.",
        elements: [
          { code: "bf:Title", desc: "Title class (superclass)" },
          { code: "bf:mainTitle", desc: "Title proper (literal)" },
          { code: "bf:subtitle", desc: "Other title information (literal)" },
          { code: "bf:partName", desc: "Name of part (literal)" },
          { code: "bf:partNumber", desc: "Number of part (literal)" },
          { code: "bf:ParallelTitle", desc: "Parallel title (subclass)" },
          { code: "bf:VariantTitle", desc: "Variant title (subclass)" },
          { code: "bf:AbbreviatedTitle", desc: "Abbreviated title (subclass)" },
          { code: "bf:KeyTitle", desc: "Key title for serials (subclass)" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha → Libris XL",
        issue: "When migrating from Koha (MARC 21) to Libris XL, 245 $b subtitle handling can vary. Libris XL expects clean separation; Koha sometimes stores subtitle with leading punctuation that needs stripping.",
      },
      {
        system: "UNIMARC → MARC 21 (Alma)",
        issue: "Alma's UNIMARC-to-MARC 21 crosswalk maps 200 $a → 245 $a correctly, but 200 $e (subtitle) → 245 $b sometimes drops the space-colon-space punctuation convention, requiring manual ISBD cleanup.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Multilingual title in Portuguese cataloging",
        problem: "A Portuguese/English bilingual resource cataloged in UNIMARC uses 200 $a for Portuguese title and 200 $d for English parallel title. Converting to Dublin Core loses the language distinction entirely — both become dc:title with no way to indicate which is primary.",
        impact: "Discovery systems may display the wrong language title to users, or concatenate both titles into an unreadable string.",
      },
    ],
  },
  {
    id: "creator",
    label: "Creator / Author",
    group: "descriptive",
    icon: "A",
    mappings: {
      unimarc: {
        field: "700 $a / 710 $a",
        label: "Personal / Corporate name",
        match: "exact",
        note: "700 (NR) for main entry personal name. 701 (R) for alternative responsibility, 702 (R) for secondary responsibility. 710/711/712 for corporate names.",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Form of name", values: "0 = Forename entry; 1 = Surname entry" },
        ],
        subfields: [
          { code: "$a", desc: "Entry element (NR)", note: "Surname or single name" },
          { code: "$b", desc: "Part of name other than entry element (NR)" },
          { code: "$c", desc: "Additions to name other than dates (R)" },
          { code: "$d", desc: "Roman numerals (NR)" },
          { code: "$f", desc: "Dates (NR)" },
          { code: "$g", desc: "Expansion of initials (NR)" },
          { code: "$p", desc: "Affiliation/address (NR)" },
          { code: "$3", desc: "Authority record identifier (NR)" },
          { code: "$4", desc: "Relator code (R)", note: "070=author, 730=translator, 440=illustrator" },
        ],
      },
      marc21: {
        field: "100 $a / 110 $a",
        label: "Main entry — name",
        match: "exact",
        note: "100 (NR) for personal, 110 (NR) for corporate, 111 (NR) for meeting. 700/710/711 (R) for additional entries. All share similar subfield structure.",
        indicators: [
          { pos: "1", label: "Type of personal name", values: "0 = Forename; 1 = Surname; 3 = Family name" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Personal name (NR)" },
          { code: "$b", desc: "Numeration (NR)" },
          { code: "$c", desc: "Titles and words associated with name (R)" },
          { code: "$d", desc: "Dates associated with name (NR)" },
          { code: "$e", desc: "Relator term (R)", note: "e.g., author, editor" },
          { code: "$q", desc: "Fuller form of name (NR)" },
          { code: "$u", desc: "Affiliation (NR)" },
          { code: "$0", desc: "Authority record control number or URI (R)" },
          { code: "$1", desc: "Real World Object URI (R)" },
          { code: "$4", desc: "Relator code (R)", note: "MARC relator code list" },
        ],
      },
      dc: {
        field: "dc:creator / dc:contributor",
        label: "Creator",
        match: "lossy",
        note: "Merges all name types into flat text. No personal vs. corporate distinction. Role info is lost unless using MARC relator refinements.",
        elements: [
          { code: "dc:creator", desc: "Entity primarily responsible for making the resource" },
          { code: "dc:contributor", desc: "Entity responsible for contributions" },
          { code: "marcrel:*", desc: "MARC relator refinements (Qualified DC)", note: "e.g., marcrel:trl for translator — rarely used" },
        ],
      },
      rda: {
        field: "RDA 19.2 / 20.2",
        label: "Creator / Contributor",
        match: "exact",
        note: "RDA clearly distinguishes creator from contributor and uses relationship designators from Appendix I.",
        elements: [
          { code: "19.2", desc: "Creator (Core element)" },
          { code: "19.3", desc: "Other person/family/corporate body associated with a work" },
          { code: "20.2", desc: "Contributor" },
          { code: "Appendix I", desc: "Relationship designators", note: "author, editor, compiler, translator, illustrator, etc." },
        ],
      },
      bibframe: {
        field: "bf:contribution / bf:agent",
        label: "Contribution",
        match: "exact",
        note: "BIBFRAME models this as a Contribution resource linking an Agent to a Work/Instance with a role. The agent is a separate linked resource.",
        elements: [
          { code: "bf:Contribution", desc: "Contribution class (links agent + role)" },
          { code: "bf:agent", desc: "Agent resource (bf:Person, bf:Organization, bf:Meeting)" },
          { code: "bf:role", desc: "Role resource (links to relator URI)" },
          { code: "bf:PrimaryContribution", desc: "Subclass for main entry equivalent" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha",
        issue: "Koha's authority module links 100/700 to authority records. When exporting to Dublin Core (OAI-PMH), the link is broken and only the text string is exported, losing the authority control.",
      },
      {
        system: "Libris XL",
        issue: "Libris XL uses linked data internally. Agent names are URIs pointing to KB's authority files. Exporting to MARC 21 flattens these back to text strings in $a, but the $0 subfield may carry the URI.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Converting a UNIMARC record with multiple roles",
        problem: "A UNIMARC record for a translated illustrated children's book has 700 entries with $4 codes for author (070), translator (730), and illustrator (440). Converting to Dublin Core produces three dc:contributor entries with no role information — you cannot tell who wrote, translated, or illustrated the book.",
        impact: "Libraries using Dublin Core for cross-collection search cannot properly attribute works or filter by role.",
      },
    ],
  },
  {
    id: "publisher",
    label: "Publisher / Publication",
    group: "descriptive",
    icon: "P",
    mappings: {
      unimarc: {
        field: "210 $a, $c, $d",
        label: "Publication, distribution",
        match: "exact",
        note: "210 (NR) for publication/distribution. IFLA ISBD punctuation applies. Field 214 may be used instead in RDA-aligned records (2017 UNIMARC update).",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Place of publication/distribution (R)" },
          { code: "$b", desc: "Address of publisher/distributor (R)" },
          { code: "$c", desc: "Name of publisher/distributor (R)" },
          { code: "$d", desc: "Date of publication/distribution (NR)" },
          { code: "$e", desc: "Place of manufacture (R)" },
          { code: "$g", desc: "Name of manufacturer (R)" },
          { code: "$h", desc: "Date of manufacture (NR)" },
        ],
      },
      marc21: {
        field: "264 $a, $b, $c",
        label: "Production, publication",
        match: "exact",
        note: "264 (R) replaced 260 for RDA records. The second indicator distinguishes function — a key structural advantage over UNIMARC 210. 260 still valid for AACR2 records.",
        indicators: [
          { pos: "1", label: "Sequence of statements", values: "# = Not applicable; 2 = Intervening; 3 = Current/latest" },
          { pos: "2", label: "Function of entity", values: "0 = Production; 1 = Publication; 2 = Distribution; 3 = Manufacture; 4 = Copyright notice date" },
        ],
        subfields: [
          { code: "$a", desc: "Place (R)" },
          { code: "$b", desc: "Name of producer/publisher/distributor/manufacturer (R)" },
          { code: "$c", desc: "Date (R)" },
          { code: "$3", desc: "Materials specified (NR)" },
        ],
      },
      dc: {
        field: "dc:publisher",
        label: "Publisher",
        match: "lossy",
        note: "Only captures publisher name. Place requires a separate element. The structured MARC relationship between place-publisher-date is destroyed.",
        elements: [
          { code: "dc:publisher", desc: "Entity responsible for making resource available" },
          { code: "dcterms:issued", desc: "Date of formal issuance (Qualified DC)" },
          { code: "dcterms:spatial", desc: "Used for place — but conflates with geographic coverage" },
        ],
      },
      rda: {
        field: "RDA 2.8",
        label: "Publication statement",
        match: "exact",
        note: "RDA 2.8.2 (place), 2.8.4 (publisher name), 2.8.6 (date). Clearly separated elements that map cleanly to and from MARC 264.",
      },
      bibframe: {
        field: "bf:provisionActivity",
        label: "Provision activity",
        match: "exact",
        note: "Type (publication/distribution/manufacture) captured as a class. Each activity has place, agent, and date properties.",
        elements: [
          { code: "bf:ProvisionActivity", desc: "Superclass" },
          { code: "bf:Publication", desc: "Publication activity (subclass)" },
          { code: "bf:Distribution", desc: "Distribution activity (subclass)" },
          { code: "bf:Manufacture", desc: "Manufacture activity (subclass)" },
          { code: "bf:place", desc: "Place of activity (property)" },
          { code: "bf:agent", desc: "Agent of activity (property)" },
          { code: "bf:date", desc: "Date of activity (property)" },
          { code: "bf:copyrightDate", desc: "Copyright date (on Instance)" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha (MARC 21)",
        issue: "Koha supports both 260 and 264 but some older templates still default to 260. Records created with 260 may not display correctly in OPAC views configured for 264.",
      },
      {
        system: "Libris XL",
        issue: "Libris XL maps publication data to linked data properties. When round-tripping back to MARC 21, the place of publication sometimes loses the $a subfield coding if the linked data property was ambiguous.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "260 vs 264 coexistence",
        problem: "A library migrating from AACR2 to RDA has a mixed catalog with some records using 260 and others using 264. OAI-PMH export to Dublin Core maps both to dc:publisher, but the extraction logic may only look for one field, silently losing publisher data for half the records.",
        impact: "Aggregators like Europeana may receive records with missing publisher information.",
      },
    ],
  },
  {
    id: "date",
    label: "Date",
    group: "descriptive",
    icon: "D",
    mappings: {
      unimarc: {
        field: "210 $d / 100 $a pos. 9-16",
        label: "Date of publication",
        match: "exact",
        note: "Display date in 210 $d; coded dates in field 100 $a. IFLA standard requires coded dates even when display date is approximate.",
        subfields: [
          { code: "210 $d", desc: "Date of publication/distribution (NR)", note: "Display form, may include brackets" },
          { code: "100 pos.8", desc: "Type of date code", note: "a=current; b=between dates; d=detailed; e=reprint; f=uncertain; g=serial ranges" },
          { code: "100 pos.9-12", desc: "Date 1 (YYYY)" },
          { code: "100 pos.13-16", desc: "Date 2 (YYYY)", note: "Context depends on pos.8" },
        ],
      },
      marc21: {
        field: "264 $c / 008 pos. 7-14",
        label: "Date of publication",
        match: "exact",
        note: "264 $c for display date; 008 for coded dates. Functionally equivalent to UNIMARC 100.",
        subfields: [
          { code: "264 $c", desc: "Date of publication (R)" },
          { code: "008/06", desc: "Type of date/Publication status", note: "s=single; m=multiple; r=reprint; t=pub+copyright; q=questionable; n=unknown" },
          { code: "008/07-10", desc: "Date 1 (YYYY)", note: "u for unknown digit" },
          { code: "008/11-14", desc: "Date 2 (YYYY)", note: "Depends on 008/06 code" },
        ],
      },
      dc: {
        field: "dc:date",
        label: "Date",
        match: "lossy",
        note: "All date types collapse into dc:date. Qualified DC offers more options but doesn't cover all MARC date types (reprint, questionable, multiple).",
        elements: [
          { code: "dc:date", desc: "A point or period of time" },
          { code: "dcterms:created", desc: "Date of creation (Qualified DC)" },
          { code: "dcterms:issued", desc: "Date of formal issuance (Qualified DC)" },
          { code: "dcterms:modified", desc: "Date resource was changed (Qualified DC)" },
          { code: "dcterms:dateCopyrighted", desc: "Copyright date (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 2.8.6 / 2.11",
        label: "Date of publication / Copyright date",
        match: "exact",
        note: "RDA separates each date type. Clean mapping to MARC 264 $c with different indicators.",
        elements: [
          { code: "2.7.6", desc: "Date of production" },
          { code: "2.8.6", desc: "Date of publication (Core)" },
          { code: "2.9.6", desc: "Date of distribution" },
          { code: "2.10.6", desc: "Date of manufacture" },
          { code: "2.11", desc: "Copyright date" },
        ],
      },
      bibframe: {
        field: "bf:provisionActivity / bf:date",
        label: "Date",
        match: "exact",
        note: "Date is a property of the ProvisionActivity resource. Copyright date has its own property on Instance.",
        elements: [
          { code: "bf:date", desc: "Date property on ProvisionActivity" },
          { code: "bf:copyrightDate", desc: "Copyright date (property on Instance)" },
          { code: "bf:originDate", desc: "Date of origin (property on Work)" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha → Dublin Core export",
        issue: "Koha's OAI-PMH server maps 260/264 $c to dc:date but does not extract the coded date from 008. Records with coded dates but no $c display date export with empty dc:date.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Multi-volume work spanning decades",
        problem: "A MARC 21 record for a multi-volume encyclopedia uses 008/06='m' (multiple dates) with Date 1=1995 and Date 2=2003. Converting to Dublin Core produces dc:date='1995' — the end date and the fact that this spans 8 years is lost entirely.",
        impact: "Users searching for resources from 2000-2003 will not find this work.",
      },
    ],
  },
  {
    id: "identifier",
    label: "Identifier",
    group: "descriptive",
    icon: "ID",
    mappings: {
      unimarc: {
        field: "010 $a / 011 $a / 001",
        label: "ISBN / ISSN / Record ID",
        match: "exact",
        note: "IFLA UNIMARC assigns a dedicated field to each identifier type — no ambiguity.",
        indicators: [
          { pos: "010 ind", label: "Undefined", values: "# # (blank)" },
        ],
        subfields: [
          { code: "010 $a", desc: "ISBN number (NR)" },
          { code: "010 $b", desc: "Qualification (NR)", note: "e.g., bound, paperback" },
          { code: "010 $d", desc: "Terms of availability/price (NR)" },
          { code: "010 $z", desc: "Erroneous ISBN (R)" },
          { code: "011 $a", desc: "ISSN number (NR)" },
          { code: "011 $y", desc: "Cancelled ISSN (R)" },
          { code: "011 $z", desc: "Erroneous ISSN (R)" },
          { code: "012 $a", desc: "Fingerprint (NR)" },
          { code: "071 $a", desc: "Publisher's number (NR)", note: "Music, sound recordings" },
        ],
      },
      marc21: {
        field: "020 $a / 022 $a / 001",
        label: "ISBN / ISSN / Control number",
        match: "exact",
        note: "Each identifier type has its own field. 024 covers DOI, URN, ISRC and others via first indicator.",
        indicators: [
          { pos: "020 ind", label: "Undefined", values: "# # (blank)" },
          { pos: "022 ind1", label: "Level of international interest", values: "# = No level; 0 = International interest; 1 = Not international" },
          { pos: "024 ind1", label: "Type of number", values: "0=ISRC; 1=UPC; 2=ISMN; 3=EAN; 4=SICI; 7=source in $2; 8=unspecified" },
        ],
        subfields: [
          { code: "020 $a", desc: "ISBN (NR)" },
          { code: "020 $q", desc: "Qualifying information (R)", note: "Binding, volume" },
          { code: "020 $z", desc: "Canceled/invalid ISBN (R)" },
          { code: "022 $a", desc: "ISSN (NR)" },
          { code: "022 $l", desc: "ISSN-L (NR)" },
          { code: "022 $y", desc: "Incorrect ISSN (R)" },
          { code: "024 $a", desc: "Standard number or code (NR)" },
          { code: "024 $2", desc: "Source of number (NR)", note: "When ind1=7" },
        ],
      },
      dc: {
        field: "dc:identifier",
        label: "Identifier",
        match: "lossy",
        note: "All identifier types merge into dc:identifier. No structural way to distinguish ISBN from ISSN from DOI.",
        elements: [
          { code: "dc:identifier", desc: "Unambiguous reference to the resource" },
          { code: "dcterms:bibliographicCitation", desc: "Bibliographic reference (Qualified DC)", note: "Rarely used for standard numbers" },
        ],
      },
      rda: {
        field: "RDA 2.15",
        label: "Identifier for the manifestation",
        match: "exact",
        note: "RDA 2.15 covers all identifiers with type specification. Maps directly to MARC fields.",
        elements: [
          { code: "2.15", desc: "Identifier for the manifestation (Core)" },
          { code: "2.15.1.4", desc: "Recording identifiers — record with type" },
          { code: "6.8", desc: "Identifier for the work" },
        ],
      },
      bibframe: {
        field: "bf:identifiedBy",
        label: "Identified by",
        match: "exact",
        note: "Each identifier is a separate typed resource — structurally superior to both MARC and Dublin Core.",
        elements: [
          { code: "bf:Isbn", desc: "ISBN resource" },
          { code: "bf:Issn", desc: "ISSN resource" },
          { code: "bf:IssnL", desc: "ISSN-L resource" },
          { code: "bf:Doi", desc: "DOI resource" },
          { code: "bf:Lccn", desc: "LCCN resource" },
          { code: "bf:Local", desc: "Local identifier" },
          { code: "bf:Urn", desc: "URN resource" },
          { code: "bf:Status", desc: "For invalid/cancelled identifiers" },
        ],
      },
    },
    systemNotes: [
      {
        system: "UNIMARC → MARC 21",
        issue: "UNIMARC 010 maps to MARC 21 020 cleanly, but UNIMARC 010 $b (binding qualifier) has no standard MARC 21 equivalent — it gets mapped to 020 $q in recent practice, but older conversions dropped it.",
      },
      {
        system: "Libris XL",
        issue: "Libris XL stores ISBNs as linked data with the bf:Isbn type. When exporting MARC 21, ISBNs without hyphens are normalized. Records imported with hyphens may export without them, causing comparison mismatches.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Multiple ISBNs for different formats",
        problem: "A MARC 21 record has three 020 fields: hardcover ISBN, paperback ISBN, and e-book ISBN, each with $q qualifiers. Converting to Dublin Core creates three dc:identifier strings with no way to tell which format each ISBN represents.",
        impact: "Link resolvers cannot determine which ISBN corresponds to the user's desired format.",
      },
    ],
  },
  {
    id: "edition",
    label: "Edition",
    group: "descriptive",
    icon: "E",
    mappings: {
      unimarc: {
        field: "205 - Edition Statement (R)",
        label: "Edition statement",
        match: "exact",
        note: "Repeatable for multiple edition statements. Transcribed from prescribed source.",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Edition statement (NR)" },
          { code: "$b", desc: "Additional edition statement (NR)" },
          { code: "$d", desc: "Parallel edition statement (R)" },
          { code: "$f", desc: "Statement of responsibility relating to the edition (NR)" },
          { code: "$g", desc: "Subsequent statement of responsibility (R)" },
        ],
      },
      marc21: {
        field: "250 - Edition Statement (R)",
        label: "Edition statement",
        match: "exact",
        note: "Transcribed from resource. Made repeatable in 2019 (previously NR). Related: 254 (Musical Presentation Statement, NR).",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Edition statement (NR)" },
          { code: "$b", desc: "Remainder of edition statement (NR)", note: "Includes statement of responsibility relating to edition" },
          { code: "$3", desc: "Materials specified (NR)" },
          { code: "$6", desc: "Linkage (NR)" },
        ],
      },
      dc: {
        field: "No dedicated element",
        label: "No standard mapping",
        match: "lossy",
        note: "Dublin Core has no edition element. Edition info may go into dc:description or be appended to dc:title. Some implementations use dc:hasVersion or dcterms:isVersionOf but these describe version relationships, not edition statements.",
        elements: [
          { code: "dc:description", desc: "Used as fallback for edition info" },
          { code: "dcterms:hasVersion", desc: "Version relationship (not edition statement)" },
        ],
      },
      rda: {
        field: "RDA 2.5 - Edition Statement",
        label: "Edition statement",
        match: "exact",
        note: "RDA 2.5 covers edition statement as a core element when applicable. Includes designation and statement of responsibility.",
        elements: [
          { code: "2.5.2", desc: "Designation of edition (Core when applicable)" },
          { code: "2.5.4", desc: "Statement of responsibility relating to the edition" },
          { code: "2.5.6", desc: "Designation of a named revision of an edition" },
          { code: "2.5.8", desc: "Statement of responsibility relating to a named revision" },
        ],
      },
      bibframe: {
        field: "bf:editionStatement",
        label: "Edition statement",
        match: "exact",
        note: "Simple literal property on bf:Instance. Less structured than MARC — no separate subfields for responsibility.",
        elements: [
          { code: "bf:editionStatement", desc: "Edition statement (literal, on Instance)" },
          { code: "bf:editionEnumeration", desc: "Edition enumeration (literal)" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha displays 250 in OPAC but older templates may not display $b (remainder of edition statement) separately. The full ISBD punctuation in $a/$b can appear doubled if the template adds its own punctuation." },
      { system: "Libris XL", issue: "Libris XL stores edition statement as a simple text property on Instance (Utgåva). When exporting to MARC 21, it maps cleanly to 250 $a, but if the original record had separate $a/$b, the subfield boundary may be lost." },
    ],
    realWorldExamples: [
      {
        scenario: "Edition statement lost in Dublin Core export",
        problem: "A textbook in its '5th revised and expanded edition' is exported to Dublin Core for a repository. Since DC has no edition element, the information is either silently dropped or dumped into dc:description where it's not searchable as structured data.",
        impact: "Users cannot filter or sort by edition in aggregators that rely on Dublin Core.",
      },
    ],
  },
  {
    id: "physical",
    label: "Physical Description",
    group: "descriptive",
    icon: "Ph",
    mappings: {
      unimarc: {
        field: "215 - Physical Description (R)",
        label: "Physical description",
        match: "exact",
        note: "Covers extent, illustrations, dimensions, and accompanying material. Follows ISBD area 5 conventions.",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Specific material designation and extent (R)", note: "e.g., 256 pages" },
          { code: "$c", desc: "Other physical details (R)", note: "Illustrations, colour, etc." },
          { code: "$d", desc: "Dimensions (R)", note: "e.g., 24 cm" },
          { code: "$e", desc: "Accompanying material (R)" },
        ],
      },
      marc21: {
        field: "300 - Physical Description (R)",
        label: "Physical description",
        match: "exact",
        note: "Covers extent, other physical details, dimensions, and accompanying material. Related: 306 (Playing Time), 340 (Physical Medium), 344-347 (Sound/Video/Digital Characteristics).",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Extent (R)", note: "e.g., 256 pages, 1 online resource" },
          { code: "$b", desc: "Other physical details (NR)", note: "Illustrations, colour, sound, etc." },
          { code: "$c", desc: "Dimensions (R)", note: "e.g., 24 cm" },
          { code: "$e", desc: "Accompanying material (NR)" },
          { code: "$f", desc: "Type of unit (R)" },
          { code: "$g", desc: "Size of unit (R)" },
          { code: "$3", desc: "Materials specified (NR)" },
        ],
      },
      dc: {
        field: "dc:format",
        label: "Format",
        match: "lossy",
        note: "dc:format captures media type or extent but not the structured physical description. Dimensions, illustrations, and accompanying material have no dedicated elements.",
        elements: [
          { code: "dc:format", desc: "File format, physical medium, or dimensions" },
          { code: "dcterms:extent", desc: "Size or duration (Qualified DC)" },
          { code: "dcterms:medium", desc: "Material or physical carrier (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 3.4 / 3.5 / 7.15 / 7.17",
        label: "Carrier and content description",
        match: "exact",
        note: "RDA distributes physical description across multiple elements. Extent is a core element for tangible resources.",
        elements: [
          { code: "3.4", desc: "Extent (Core for tangible resources)" },
          { code: "3.5", desc: "Dimensions" },
          { code: "7.15", desc: "Illustrative content" },
          { code: "7.17", desc: "Colour content" },
          { code: "3.21", desc: "Supplementary content", note: "Accompanying material" },
        ],
      },
      bibframe: {
        field: "bf:extent / bf:dimensions",
        label: "Physical description properties",
        match: "exact",
        note: "BIBFRAME separates each aspect into its own property on Instance. More granular than MARC 300.",
        elements: [
          { code: "bf:extent", desc: "Extent (property on Instance)" },
          { code: "bf:dimensions", desc: "Dimensions (literal on Instance)" },
          { code: "bf:illustrativeContent", desc: "Illustrative content (on Work)" },
          { code: "bf:colorContent", desc: "Colour content (on Work)" },
          { code: "bf:supplementaryContent", desc: "Supplementary content (on Work)" },
          { code: "bf:SupplementaryContent", desc: "Supplementary content class" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha's 300 $a is used for OPAC display and also feeds the 'pages' facet in Elasticsearch-based catalogs. If extent is entered inconsistently (e.g., 'ca 250 s.' vs '250 pages'), faceting breaks." },
      { system: "Libris XL", issue: "Libris XL stores extent as a structured property (Omfång) on Instance. Swedish practice uses 'sidor' (pages) or 's.' abbreviation. Export to MARC 21 maps to 300 $a but may not match international conventions." },
    ],
    realWorldExamples: [
      {
        scenario: "Physical description in a digital-first world",
        problem: "A library catalogs both a print book (300 $a '328 pages' $c '22 cm') and its e-book equivalent (300 $a '1 online resource'). When both are exported to Dublin Core, both get dc:format but the rich physical description of the print edition is flattened into a single string.",
        impact: "Users cannot distinguish between physical and digital manifestations in aggregated search results.",
      },
    ],
  },
  {
    id: "series",
    label: "Series",
    group: "descriptive",
    icon: "Se",
    mappings: {
      unimarc: {
        field: "225 - Series (R)",
        label: "Series",
        match: "exact",
        note: "Series title as it appears on the resource. Field 410 used for series tracing (linked to authority).",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Series note", values: "# = Series note; 0 = No series note; 1 = Uncontrolled note; 2 = Controlled note" },
        ],
        subfields: [
          { code: "$a", desc: "Series title (NR)" },
          { code: "$d", desc: "Parallel series title (R)" },
          { code: "$e", desc: "Other title information (R)", note: "Series subtitle" },
          { code: "$f", desc: "Statement of responsibility (NR)" },
          { code: "$h", desc: "Number of a part (R)" },
          { code: "$i", desc: "Name of a part (R)" },
          { code: "$v", desc: "Volume designation (NR)" },
          { code: "$x", desc: "ISSN of series (NR)" },
        ],
      },
      marc21: {
        field: "490 - Series Statement (R)",
        label: "Series statement",
        match: "exact",
        note: "Series as it appears on the resource. First indicator controls whether an 8XX series added entry is present. Related: 800-830 (Series Added Entry fields) for authorized form.",
        indicators: [
          { pos: "1", label: "Series tracing policy", values: "0 = Series not traced; 1 = Series traced (8XX present)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Series statement (R)" },
          { code: "$l", desc: "Library of Congress call number (NR)" },
          { code: "$v", desc: "Volume/sequential designation (R)" },
          { code: "$x", desc: "ISSN of series (R)" },
          { code: "$3", desc: "Materials specified (NR)" },
        ],
      },
      dc: {
        field: "dc:relation.isPartOf",
        label: "Is Part Of",
        match: "partial",
        note: "Series can be expressed as dc:relation with dcterms:isPartOf qualifier. But the volume number, ISSN, and subseries structure are lost. Many implementations simply ignore series.",
        elements: [
          { code: "dcterms:isPartOf", desc: "Related resource the described resource is part of" },
          { code: "dc:relation", desc: "Generic related resource (unqualified DC)" },
        ],
      },
      rda: {
        field: "RDA 2.12 - Series Statement",
        label: "Series statement",
        match: "exact",
        note: "RDA treats series statement as a core element when applicable. Includes title, numbering, and sub-series.",
        elements: [
          { code: "2.12.2", desc: "Title proper of series (Core when applicable)" },
          { code: "2.12.4", desc: "Parallel title of series" },
          { code: "2.12.6", desc: "Other title information of series" },
          { code: "2.12.8", desc: "Statement of responsibility of series" },
          { code: "2.12.9", desc: "ISSN of series" },
          { code: "2.12.10", desc: "Numbering within series" },
          { code: "2.12.12-17", desc: "Subseries elements (parallel structure)" },
        ],
      },
      bibframe: {
        field: "bf:hasSeries / bf:seriesStatement",
        label: "Series",
        match: "exact",
        note: "BIBFRAME can model series as a linked resource (bf:hasSeries linking to another bf:Instance) or as a simple literal (bf:seriesStatement). The linked approach is richer.",
        elements: [
          { code: "bf:hasSeries", desc: "Links to series Instance resource" },
          { code: "bf:seriesStatement", desc: "Series statement as literal text" },
          { code: "bf:seriesEnumeration", desc: "Volume/number within series" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha handles 490/8XX series linking through the authority module. If 490 ind1=1 but no matching 800-830 exists, the series displays in OPAC but isn't linked or browsable as a series." },
      { system: "Libris XL", issue: "Libris XL models series as a linked Instans (seriemedlemskap). The series title links to a series authority. Export to MARC 21 generates both 490 and 830, but the $v volume numbering can be inconsistent between the two." },
    ],
    realWorldExamples: [
      {
        scenario: "Series lost in Dublin Core harvesting",
        problem: "A monograph in the series 'Cambridge Studies in Linguistics ; 145' is exported via OAI-PMH. The aggregator receives dcterms:isPartOf with the series title but the volume number '145' is lost. The ISSN of the series is not transmitted either.",
        impact: "Users cannot determine the volume's position within the series or verify the series through its ISSN.",
      },
    ],
  },
  {
    id: "language",
    label: "Language",
    group: "descriptive",
    icon: "L",
    mappings: {
      unimarc: {
        field: "101 - Language of the Item (NR)",
        label: "Language of the item",
        match: "exact",
        note: "Coded language field. Uses ISO 639-2 three-letter codes. Covers text language, original language, and intermediary translation language.",
        indicators: [
          { pos: "1", label: "Translation indicator", values: "0 = Item is in its original language; 1 = Item is a translation; 2 = Contains translations other than summaries" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Language of text (R)", note: "ISO 639-2 code" },
          { code: "$b", desc: "Language of intermediary text (R)", note: "When translation is indirect" },
          { code: "$c", desc: "Language of original work (R)" },
          { code: "$d", desc: "Language of summary (R)" },
          { code: "$g", desc: "Language of original title on title page (NR)" },
          { code: "$h", desc: "Language of libretto (R)" },
          { code: "$j", desc: "Language of subtitles (R)" },
        ],
      },
      marc21: {
        field: "008/35-37 + 041 - Language Code (R)",
        label: "Language code",
        match: "exact",
        note: "008/35-37 for primary language (fixed field). 041 for detailed language coding when item involves multiple languages or translations. Uses MARC language code list.",
        indicators: [
          { pos: "041 ind1", label: "Translation indicator", values: "# = No info; 0 = Not a translation; 1 = Translation or includes a translation" },
          { pos: "041 ind2", label: "Source of code", values: "# = MARC language code; 7 = Source in $2" },
        ],
        subfields: [
          { code: "008/35-37", desc: "Language (fixed field)", note: "Three-letter MARC code" },
          { code: "041 $a", desc: "Language code of text (R)" },
          { code: "041 $b", desc: "Language code of summary (R)" },
          { code: "041 $d", desc: "Language code of sung/spoken text (R)" },
          { code: "041 $h", desc: "Language code of original (R)" },
          { code: "041 $j", desc: "Language code of subtitles (R)" },
          { code: "041 $k", desc: "Language code of intermediary translations (R)" },
          { code: "041 $2", desc: "Source of code (NR)", note: "e.g., iso639-2b" },
        ],
      },
      dc: {
        field: "dc:language",
        label: "Language",
        match: "partial",
        note: "dc:language captures the language of the resource. Single element — no way to distinguish between text language, original language, summary language, or subtitle language. RFC 4646 or ISO 639 codes recommended.",
        elements: [
          { code: "dc:language", desc: "Language of the resource" },
          { code: "dcterms:RFC4646", desc: "Encoding scheme (Qualified DC)" },
          { code: "dcterms:ISO639-2", desc: "Encoding scheme (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 7.12 / 7.14",
        label: "Language of content",
        match: "exact",
        note: "RDA treats language of expression as a core element. Separate elements for different language roles.",
        elements: [
          { code: "7.12", desc: "Language of the content (Core)" },
          { code: "7.14", desc: "Accessibility content", note: "Includes language of subtitles, audio description" },
          { code: "6.11", desc: "Language of expression (on Expression)" },
          { code: "24.6", desc: "Language of expression used as access point qualifier" },
        ],
      },
      bibframe: {
        field: "bf:language",
        label: "Language",
        match: "exact",
        note: "bf:language links to a Language resource (typically using URI from id.loc.gov). Can express multiple languages and their roles (text, original, summary).",
        elements: [
          { code: "bf:language", desc: "Language property (on Work)" },
          { code: "bf:Language", desc: "Language class" },
          { code: "bf:part", desc: "Part qualifier", note: "Specifies which part (summary, subtitle, etc.)" },
          { code: "bf:translationOf", desc: "Links to original language work" },
          { code: "bf:hasTranslation", desc: "Links to translated work" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha uses 008/35-37 for the language facet in OPAC. If 041 contains multiple languages but 008 only has the primary, the facet won't reflect multilingual content. Swedish libraries cataloging bilingual works need both fields." },
      { system: "Libris XL", issue: "Libris XL stores language as a linked entity (Språk) using URIs from id.kb.se. Multiple languages are well-supported. Export to MARC 21 generates both 008/35-37 and 041, but the translation indicator (041 ind1) may default to '#' even for translations." },
    ],
    realWorldExamples: [
      {
        scenario: "Translation chain lost in crosswalk",
        problem: "A Swedish translation of a Japanese novel, translated via English as intermediary language. UNIMARC 101 captures this cleanly: $a swe $c jpn $b eng (ind1=1). MARC 21 041 handles it similarly with $a swe $h jpn $k eng. Converting to Dublin Core produces dc:language='swe' — the entire translation history is lost.",
        impact: "Researchers studying translation practices cannot trace intermediary languages in Dublin Core-based repositories.",
      },
    ],
  },
  {
    id: "contenttype",
    label: "Content / Media / Carrier",
    group: "descriptive",
    icon: "CMC",
    mappings: {
      unimarc: {
        field: "181/182/183 - Content/Media/Carrier Type",
        label: "Content, media, carrier type",
        match: "exact",
        note: "Introduced to align UNIMARC with RDA. 181 for content type, 182 for media type, 183 for carrier type. In older records, type info is in Leader/06-07 and 135 (Coded Data Field: Electronic Resources).",
        subfields: [
          { code: "181 $a", desc: "Content type code (R)", note: "From IFLA list" },
          { code: "181 $2", desc: "Source (NR)" },
          { code: "182 $a", desc: "Media type code (R)" },
          { code: "182 $2", desc: "Source (NR)" },
          { code: "183 $a", desc: "Carrier type code (R)" },
          { code: "183 $2", desc: "Source (NR)" },
        ],
      },
      marc21: {
        field: "336/337/338 - Content/Media/Carrier Type (R)",
        label: "Content, media, carrier type",
        match: "exact",
        note: "Core RDA elements since 2013. Replaced GMD (General Material Designation) in 245 $h. Each field uses controlled vocabulary from RDA/ONIX Framework.",
        indicators: [
          { pos: "336 ind", label: "Undefined", values: "# # (blank)" },
          { pos: "337 ind", label: "Undefined", values: "# # (blank)" },
          { pos: "338 ind", label: "Undefined", values: "# # (blank)" },
        ],
        subfields: [
          { code: "336 $a", desc: "Content type term (R)", note: "e.g., text, performed music, still image" },
          { code: "336 $b", desc: "Content type code (R)", note: "e.g., txt, prm, sti" },
          { code: "336 $2", desc: "Source (NR)", note: "rdacontent" },
          { code: "337 $a", desc: "Media type term (R)", note: "e.g., unmediated, computer, audio" },
          { code: "337 $b", desc: "Media type code (R)", note: "e.g., n, c, s" },
          { code: "337 $2", desc: "Source (NR)", note: "rdamedia" },
          { code: "338 $a", desc: "Carrier type term (R)", note: "e.g., volume, online resource, audio disc" },
          { code: "338 $b", desc: "Carrier type code (R)", note: "e.g., nc, cr, sd" },
          { code: "338 $2", desc: "Source (NR)", note: "rdacarrier" },
        ],
      },
      dc: {
        field: "dc:type / dc:format",
        label: "Type and format",
        match: "lossy",
        note: "Dublin Core conflates content type and carrier type into dc:type (DCMI Type Vocabulary) and dc:format (MIME types). The three-way RDA distinction (what it IS / how you ACCESS it / what it's ON) collapses into two coarse elements.",
        elements: [
          { code: "dc:type", desc: "Nature or genre (DCMI Type Vocabulary)", note: "Text, Image, Sound, etc." },
          { code: "dc:format", desc: "File format or physical medium", note: "MIME types or physical description" },
        ],
      },
      rda: {
        field: "RDA 6.9 / 3.2 / 3.3",
        label: "Content / Media / Carrier type",
        match: "exact",
        note: "These are core RDA elements. The three-way distinction is fundamental to the RDA framework and replaces the old GMD concept.",
        elements: [
          { code: "6.9", desc: "Content type (Core)", note: "text, performed music, cartographic image, etc." },
          { code: "3.2", desc: "Media type (Core)", note: "unmediated, computer, audio, video, etc." },
          { code: "3.3", desc: "Carrier type (Core)", note: "volume, online resource, audio disc, etc." },
        ],
      },
      bibframe: {
        field: "bf:content / bf:media / bf:carrier",
        label: "Content, media, carrier",
        match: "exact",
        note: "BIBFRAME mirrors the RDA three-way distinction. Each links to a controlled vocabulary resource.",
        elements: [
          { code: "bf:content", desc: "Content type (property on Work)" },
          { code: "bf:media", desc: "Media type (property on Instance)" },
          { code: "bf:carrier", desc: "Carrier type (property on Instance)" },
          { code: "bf:Content", desc: "Content type class" },
          { code: "bf:Media", desc: "Media type class" },
          { code: "bf:Carrier", desc: "Carrier type class" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha introduced support for 336/337/338 display in recent versions, but many Swedish library Koha installations still use older templates that display 245 $h (GMD) instead. Records with 336/337/338 but no 245 $h show no material type in older OPACs." },
      { system: "Libris XL", issue: "Libris XL uses content/media/carrier types as core structured properties (Innehållstyp, Mediatyp, Bärartyp). These map directly to MARC 336/337/338 on export. The KB Metadatabyrån guidance makes these mandatory for Swedish cataloging." },
    ],
    realWorldExamples: [
      {
        scenario: "GMD to 336/337/338 migration chaos",
        problem: "A library catalog has 15 years of records with 245 $h [electronic resource] and newer records with 336 $a text + 337 $a computer + 338 $a online resource. The OPAC displays different material type labels depending on which fields are present, confusing users.",
        impact: "Faceted search by format produces inconsistent results because legacy and current records use different fields for the same information.",
      },
    ],
  },
  {
    id: "notes",
    label: "Notes",
    group: "descriptive",
    icon: "N",
    mappings: {
      unimarc: {
        field: "300-345 - Notes Block",
        label: "Notes",
        match: "exact",
        note: "UNIMARC uses 3XX block for notes. Each note type has a specific field. 300 for general notes, 320 for bibliography/index notes, 327 for contents notes.",
        subfields: [
          { code: "300 $a", desc: "General note (R)" },
          { code: "302 $a", desc: "Note on coded information (R)" },
          { code: "304 $a", desc: "Note relating to title and statement of responsibility (R)" },
          { code: "305 $a", desc: "Note relating to edition and bibliographic history (R)" },
          { code: "307 $a", desc: "Note relating to physical description (R)" },
          { code: "311 $a", desc: "Note relating to linking fields (R)" },
          { code: "320 $a", desc: "Bibliography/index note (R)" },
          { code: "327 $a", desc: "Contents note (R)" },
          { code: "330 $a", desc: "Summary or abstract (R)" },
          { code: "345 $a", desc: "Acquisition information note (R)" },
        ],
      },
      marc21: {
        field: "500-588 - Note Fields (5XX Block)",
        label: "Notes",
        match: "exact",
        note: "Extensive note block. Each note type has a dedicated field. Key fields: 500 (General), 504 (Bibliography), 505 (Contents), 520 (Summary), 546 (Language), 588 (Source of description).",
        subfields: [
          { code: "500 $a", desc: "General note (R)" },
          { code: "502 $a", desc: "Dissertation note (R)" },
          { code: "504 $a", desc: "Bibliography, etc. note (R)", note: "e.g., 'Includes bibliographical references (p. 230-245) and index'" },
          { code: "505 $a", desc: "Formatted contents note (R)", note: "ind1: 0=Complete; 1=Incomplete; 2=Partial; ind2: #=basic; 0=enhanced" },
          { code: "505 $t", desc: "Title within contents (R)", note: "Enhanced contents note" },
          { code: "505 $r", desc: "Statement of responsibility (R)" },
          { code: "520 $a", desc: "Summary, etc. (R)", note: "ind1: #=summary; 1=review; 2=scope; 3=abstract; 4=content advice" },
          { code: "546 $a", desc: "Language note (R)" },
          { code: "588 $a", desc: "Source of description note (R)", note: "Required in RDA" },
        ],
      },
      dc: {
        field: "dc:description",
        label: "Description",
        match: "lossy",
        note: "All note types collapse into dc:description. The distinction between a bibliography note, contents note, and summary is lost. Qualified DC adds dcterms:abstract and dcterms:tableOfContents.",
        elements: [
          { code: "dc:description", desc: "Account of the resource" },
          { code: "dcterms:abstract", desc: "Summary of the resource (Qualified DC)" },
          { code: "dcterms:tableOfContents", desc: "List of subunits (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 7.x - Content Description",
        label: "Various content description elements",
        match: "exact",
        note: "RDA distributes note content across multiple elements in chapters 7 and 25. Some are core elements.",
        elements: [
          { code: "7.10", desc: "Summarization of the content" },
          { code: "7.16", desc: "Supplementary content", note: "Bibliographies, indexes, etc." },
          { code: "7.12", desc: "Language of the content" },
          { code: "25.1", desc: "Related work", note: "For contents notes linking to separate works" },
          { code: "2.17", desc: "Note on manifestation" },
          { code: "2.20", desc: "Note on resource description", note: "Source of description" },
        ],
      },
      bibframe: {
        field: "bf:note / bf:summary / bf:tableOfContents",
        label: "Notes and content description",
        match: "exact",
        note: "BIBFRAME types notes through distinct properties. More structured than MARC 5XX but less granular — many MARC note types map to generic bf:note.",
        elements: [
          { code: "bf:note", desc: "General note (property on any resource)" },
          { code: "bf:Note", desc: "Note class" },
          { code: "bf:summary", desc: "Summary/abstract (property on Work)" },
          { code: "bf:Summary", desc: "Summary class" },
          { code: "bf:tableOfContents", desc: "Contents note (property on Work)" },
          { code: "bf:TableOfContents", desc: "Table of contents class" },
          { code: "bf:supplementaryContent", desc: "Bibliography/index info (on Work)" },
          { code: "bf:dissertation", desc: "Dissertation info (on Work)" },
        ],
      },
    },
    systemNotes: [
      { system: "Koha", issue: "Koha indexes 505 $t (contents titles) separately for searching, which is powerful for anthologies. But if contents are entered in 505 $a as a single string instead of using enhanced format ($t/$r), individual titles are not separately searchable." },
      { system: "Libris XL", issue: "Libris XL maps most MARC 5XX notes to a generic 'Anmärkning' (Note) property. Some specific note types (520 summary, 505 contents) have dedicated properties, but many nuanced MARC note types flatten into the generic note on round-trip." },
    ],
    realWorldExamples: [
      {
        scenario: "Enhanced contents note in cross-system migration",
        problem: "A library has cataloged an anthology with enhanced 505 contents: $t Title one / $r Author one $t Title two / $r Author two (20 entries). During system migration the MARC is preserved, but the new OPAC template may switch from enhanced to basic display, showing the contents as an unformatted text wall.",
        impact: "Individual work titles and authors within the anthology lose their visual structure, reducing discoverability of contributions.",
      },
    ],
  },
  {
    id: "subject",
    label: "Subject",
    group: "subject",
    icon: "S",
    mappings: {
      unimarc: {
        field: "600-608 - Subject Access Fields (R)",
        label: "Subject access fields",
        match: "exact",
        note: "Each subject type has its own field. IFLA standard uses $2 for thesaurus source code.",
        indicators: [
          { pos: "606 ind1", label: "Level of subject term", values: "# = Not specified; 0 = Not applicable; 1 = Primary; 2 = Secondary" },
        ],
        subfields: [
          { code: "600 $a", desc: "Personal name subject (NR)" },
          { code: "601 $a", desc: "Corporate name subject (NR)" },
          { code: "602 $a", desc: "Family name subject (NR)" },
          { code: "604", desc: "Author/title subject (NR)" },
          { code: "605 $a", desc: "Title used as subject (NR)" },
          { code: "606 $a", desc: "Topical subject (NR)" },
          { code: "606 $x", desc: "Topical subdivision (R)" },
          { code: "606 $y", desc: "Geographical subdivision (R)" },
          { code: "606 $z", desc: "Chronological subdivision (R)" },
          { code: "607 $a", desc: "Geographical name subject (NR)" },
          { code: "608 $a", desc: "Form/genre heading (NR)" },
          { code: "6XX $2", desc: "System code (NR)", note: "rameau, lcsh, sao, etc." },
          { code: "6XX $3", desc: "Authority record identifier (NR)" },
        ],
      },
      marc21: {
        field: "600-651, 653, 655",
        label: "Subject access fields",
        match: "exact",
        note: "Second indicator specifies thesaurus: 0=LCSH, 1=LC Children's, 2=MeSH, 4=source not specified, 7=source in $2.",
        indicators: [
          { pos: "650 ind1", label: "Level of subject", values: "# = No info; 0 = No level specified; 1 = Primary; 2 = Secondary" },
          { pos: "650 ind2", label: "Thesaurus", values: "0 = LCSH; 1 = LC Children's; 2 = MeSH; 4 = Source not specified; 7 = Source in $2" },
        ],
        subfields: [
          { code: "600 $a", desc: "Personal name subject (NR)" },
          { code: "610 $a", desc: "Corporate name subject (NR)" },
          { code: "611 $a", desc: "Meeting name subject (NR)" },
          { code: "630 $a", desc: "Uniform title subject (NR)" },
          { code: "648 $a", desc: "Chronological term (NR)" },
          { code: "650 $a", desc: "Topical term (NR)" },
          { code: "650 $v", desc: "Form subdivision (R)" },
          { code: "650 $x", desc: "General subdivision (R)" },
          { code: "650 $y", desc: "Chronological subdivision (R)" },
          { code: "650 $z", desc: "Geographic subdivision (R)" },
          { code: "651 $a", desc: "Geographic name subject (NR)" },
          { code: "655 $a", desc: "Genre/form term (NR)" },
          { code: "6XX $2", desc: "Source of heading (NR)", note: "sao, lcsh, mesh, saogf, etc." },
          { code: "6XX $0", desc: "Authority record control number or URI (R)" },
        ],
      },
      dc: {
        field: "dc:subject",
        label: "Subject",
        match: "lossy",
        note: "All subject types collapse into dc:subject. Thesaurus source may be indicated with a scheme qualifier but often isn't.",
        elements: [
          { code: "dc:subject", desc: "Topic of the resource" },
          { code: "dcterms:LCSH", desc: "Encoding scheme (Qualified DC)" },
          { code: "dcterms:MeSH", desc: "Encoding scheme (Qualified DC)" },
          { code: "dcterms:spatial", desc: "Spatial characteristics (Qualified DC)", note: "May overlap with geographic subject" },
          { code: "dcterms:temporal", desc: "Temporal characteristics (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 23.1",
        label: "Subject relationship",
        match: "partial",
        note: "RDA defines the subject relationship broadly and defers to vocabulary standards (LCSH, SAO, etc.).",
        elements: [
          { code: "23.1", desc: "Subject of the work" },
          { code: "23.4", desc: "Subject relationship designator" },
        ],
      },
      bibframe: {
        field: "bf:subject",
        label: "Subject",
        match: "partial",
        note: "BIBFRAME uses typed subject resources. Retains type distinction lost in Dublin Core.",
        elements: [
          { code: "bf:subject", desc: "Subject property (on Work)" },
          { code: "bf:Topic", desc: "Topical subject (class)" },
          { code: "bf:Place", desc: "Geographic subject (class)" },
          { code: "bf:Temporal", desc: "Chronological subject (class)" },
          { code: "bf:Person", desc: "Personal name subject (class)" },
          { code: "bf:Organization", desc: "Corporate name subject (class)" },
          { code: "bf:source", desc: "Source vocabulary (property)", note: "Links to vocabulary URI" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha",
        issue: "Koha's authority plugin for 650 works well with LCSH but support for Svenska ämnesord (SAO) requires custom configuration. The $2 subfield must contain 'sao' and the authority framework must be configured separately.",
      },
      {
        system: "Libris XL → Koha",
        issue: "Libris XL stores SAO headings as linked URIs (id.kb.se). Exporting to MARC 21 for Koha flattens these to text in 650 $a with $2 sao, but the URI in $0 may not resolve in Koha's authority module.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Swedish subject headings in an international context",
        problem: "A Swedish library record uses 650 _7 $a Klimatförändringar $2 sao (Svenska ämnesord). When harvested via OAI-PMH into Europeana as dc:subject, the thesaurus source is lost. A French user sees 'Klimatförändringar' with no indication it's a Swedish controlled term and no link to the equivalent LCSH 'Climatic changes'.",
        impact: "Cross-language subject discovery fails because the vocabulary context is stripped during the crosswalk.",
      },
      {
        scenario: "SAO vs LCSH: structural differences in compound headings",
        problem: "LCSH uses pre-coordinated headings with subdivisions: '650 _0 $a Libraries $x Special collections $x Children\\'s literature'. SAO uses a flatter structure: '650 _7 $a Barnlitteratur $2 sao' and '650 _7 $a Bibliotek $x Specialsamlingar $2 sao' as two separate headings. When a record has both SAO and LCSH headings and is crosswalked to Dublin Core, the structural logic of both systems is lost — all subdivisions become flat text strings.",
        impact: "The carefully constructed hierarchy of LCSH subdivisions and the deliberate simplicity of SAO headings both dissolve into undifferentiated dc:subject entries, making post-coordinated search the only option.",
      },
      {
        scenario: "SAO heading with no LCSH equivalent",
        problem: "SAO contains headings specific to Swedish contexts that have no direct LCSH match — for example, 'Allemansrätten' (the Swedish right of public access to nature). LCSH has no equivalent heading. When merging Swedish and American library catalogs, these culturally specific headings either get dropped or mapped to a broader LCSH term like 'Right of property' which misrepresents the concept entirely.",
        impact: "Culturally specific knowledge is either lost or distorted when forced into a vocabulary designed for a different legal and cultural context.",
      },
    ],
  },
  {
    id: "classification",
    label: "Classification",
    group: "subject",
    icon: "C",
    mappings: {
      unimarc: {
        field: "675 (UDC) / 676 (DDC) / 680 (LC)",
        label: "Classification numbers",
        match: "exact",
        note: "Each classification system has its own field. National implementations prioritize different systems.",
        indicators: [
          { pos: "675 ind", label: "Undefined", values: "# # (blank)" },
          { pos: "676 ind1", label: "Type of edition", values: "# = No info; 0 = Full edition; 1 = Abridged" },
        ],
        subfields: [
          { code: "675 $a", desc: "UDC notation (NR)" },
          { code: "675 $v", desc: "Edition identifier (NR)" },
          { code: "675 $z", desc: "Language of edition (NR)" },
          { code: "676 $a", desc: "DDC number (NR)" },
          { code: "676 $v", desc: "Edition of DDC (NR)" },
          { code: "680 $a", desc: "LCC class number (NR)" },
          { code: "680 $b", desc: "Book number (NR)" },
          { code: "686 $a", desc: "Other classification number (NR)", note: "For SAB and other national systems" },
          { code: "686 $2", desc: "System code (NR)", note: "Identifies the classification scheme" },
        ],
      },
      marc21: {
        field: "080 (UDC) / 082 (DDC) / 050 (LC)",
        label: "Classification numbers",
        match: "exact",
        note: "SAB classification stored in 084 $a with $2 kssb/8 (8th edition).",
        indicators: [
          { pos: "082 ind1", label: "Type of edition", values: "0 = Full; 1 = Abridged; 7 = Other in $2" },
          { pos: "082 ind2", label: "Source", values: "# = No info; 0 = Assigned by LC; 4 = Other agency" },
          { pos: "050 ind1", label: "In LC collection", values: "# = No info; 0 = In LC; 1 = Not in LC" },
          { pos: "050 ind2", label: "Source", values: "0 = Assigned by LC; 4 = Other agency" },
        ],
        subfields: [
          { code: "050 $a", desc: "Classification number (R)" },
          { code: "050 $b", desc: "Item number (NR)" },
          { code: "080 $a", desc: "UDC number (NR)" },
          { code: "080 $2", desc: "Edition identifier (NR)" },
          { code: "082 $a", desc: "DDC number (R)" },
          { code: "082 $b", desc: "Item number (NR)" },
          { code: "082 $2", desc: "Edition number (NR)" },
          { code: "084 $a", desc: "Classification number (R)", note: "SAB, BBK, other national systems" },
          { code: "084 $2", desc: "Source of number (NR)", note: "e.g., kssb/8 for SAB 8th ed." },
        ],
      },
      dc: {
        field: "dc:subject (with scheme)",
        label: "Subject",
        match: "lossy",
        note: "No dedicated classification element. Notations go into dc:subject — conflating notation with natural-language headings.",
        elements: [
          { code: 'dc:subject xsi:type="dcterms:DDC"', desc: "DDC notation as subject (Qualified DC)" },
          { code: 'dc:subject xsi:type="dcterms:UDC"', desc: "UDC notation as subject (Qualified DC)" },
          { code: 'dc:subject xsi:type="dcterms:LCC"', desc: "LCC notation as subject (Qualified DC)" },
        ],
      },
      rda: {
        field: "RDA 6.2 (classification)",
        label: "Not directly addressed",
        match: "none",
        note: "RDA focuses on description and access, not classification. Libraries using RDA still assign DDC/UDC/SAB independently.",
        elements: [],
      },
      bibframe: {
        field: "bf:classification",
        label: "Classification",
        match: "exact",
        note: "BIBFRAME has typed subclasses for major systems. Notation and edition are separate properties — structurally clean.",
        elements: [
          { code: "bf:Classification", desc: "Classification superclass" },
          { code: "bf:ClassificationDdc", desc: "DDC classification (subclass)" },
          { code: "bf:ClassificationLcc", desc: "LCC classification (subclass)" },
          { code: "bf:ClassificationUdc", desc: "UDC classification (subclass)" },
          { code: "bf:ClassificationNlm", desc: "NLM classification (subclass)" },
          { code: "bf:classificationPortion", desc: "Classification number (property)" },
          { code: "bf:itemPortion", desc: "Item number (property)" },
          { code: "bf:edition", desc: "Edition of scheme (property)" },
          { code: "bf:source", desc: "Source (property)", note: "For systems like SAB not in named subclasses" },
        ],
      },
    },
    classificationSystems: {
      sab: {
        label: "SAB (Klassifikationssystem för svenska bibliotek)",
        note: "Used in Swedish public and academic libraries. Stored in MARC 21 as 084 $a with $2 kssb/8 (8th edition). Hierarchical structure with main classes A-Ö. No direct equivalent in UNIMARC — requires local field or 686.",
        example: "Hc = Bibliografi, Hca = Nationalbibliografi",
      },
      ddc: {
        label: "DDC (Dewey Decimal Classification)",
        note: "Internationally used. UNIMARC 676, MARC 21 082. Notation is numeric (000-999) with decimal expansion. Well-supported across all systems.",
        example: "025.3 = Cataloguing and classification",
      },
      udc: {
        label: "UDC (Universal Decimal Classification)",
        note: "Used extensively in Southern Europe, Central Europe, and many UNIMARC-based libraries worldwide. UNIMARC 675, MARC 21 080. More expressive syntax than DDC (colon for relation, plus sign for addition, double colon for order-fixing). Widely used for shelf classification in academic libraries.",
        example: "025.4 = Subject analysis. Classification. Indexing",
      },
    },
    systemNotes: [
      {
        system: "Libris XL",
        issue: "SAB classification is core to Swedish library practice. Libris XL stores SAB in 084 with $2 kssb/8. When a Swedish library exports to an international aggregator, SAB numbers mean nothing without the code list — and most aggregators don't carry it.",
      },
      {
        system: "Koha (Swedish libraries)",
        issue: "Koha has no built-in SAB validation. Classification numbers in 084 are free text — typos in SAB notation (e.g., 'Hc.01' instead of 'Hc.01') are not caught, unlike DDC which has the classification plugin.",
      },
      {
        system: "UNIMARC → MARC 21 (Alma)",
        issue: "Portuguese UDC numbers in UNIMARC 675 map to MARC 21 080, but the $v (edition) subfield mapping can be inconsistent. Some conversions lose the UDC edition indicator, making it impossible to know which UDC edition was used.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "SAB classification in Dublin Core export",
        problem: "A Swedish academic library exports records to a European aggregator via OAI-PMH. The SAB number 'Qb' (physics) ends up in dc:subject alongside the Swedish subject heading 'Fysik'. The aggregator cannot distinguish the classification notation from the subject term, so 'Qb' appears as a browsable subject — confusing users.",
        impact: "Classification notations pollute the subject browse when crosswalked without type distinction.",
      },
    ],
  },
  {
    id: "genre",
    label: "Genre / Form",
    group: "subject",
    icon: "G",
    mappings: {
      unimarc: {
        field: "608 $a",
        label: "Form, genre heading",
        match: "exact",
        note: "Less widely adopted than MARC 21's 655 — many UNIMARC implementations use 606 for genre terms instead.",
        indicators: [
          { pos: "1", label: "Undefined", values: "# (blank)" },
          { pos: "2", label: "Undefined", values: "# (blank)" },
        ],
        subfields: [
          { code: "$a", desc: "Entry element (NR)" },
          { code: "$j", desc: "Form subdivision (R)" },
          { code: "$x", desc: "Topical subdivision (R)" },
          { code: "$y", desc: "Geographical subdivision (R)" },
          { code: "$z", desc: "Chronological subdivision (R)" },
          { code: "$2", desc: "System code (NR)", note: "Source vocabulary" },
          { code: "$3", desc: "Authority record identifier (NR)" },
        ],
      },
      marc21: {
        field: "655 $a",
        label: "Index term — genre/form",
        match: "exact",
        note: "Growing in importance with the separation of 'about-ness' (650 topical) from 'is-ness' (655 genre/form).",
        indicators: [
          { pos: "1", label: "Type of heading", values: "# = Basic; 0 = Faceted" },
          { pos: "2", label: "Thesaurus", values: "0 = LCSH (pre-LCGFT); 4 = Source not specified; 7 = Source in $2" },
        ],
        subfields: [
          { code: "$a", desc: "Genre/form data or focus term (NR)" },
          { code: "$b", desc: "Non-focus term (R)" },
          { code: "$c", desc: "Facet/hierarchy designation (R)" },
          { code: "$v", desc: "Form subdivision (R)" },
          { code: "$x", desc: "General subdivision (R)" },
          { code: "$y", desc: "Chronological subdivision (R)" },
          { code: "$z", desc: "Geographic subdivision (R)" },
          { code: "$2", desc: "Source of term (NR)", note: "lcgft, saogf, fast, etc." },
          { code: "$0", desc: "Authority record control number or URI (R)" },
        ],
      },
      dc: {
        field: "dc:type",
        label: "Type",
        match: "partial",
        note: "dc:type with DCMI Type Vocabulary captures broad types but not specific genre/form. The granularity gap is enormous.",
        elements: [
          { code: "dc:type", desc: "Nature or genre of the resource" },
          { code: "DCMI Types", desc: "Collection, Dataset, Event, Image, Interactive Resource, Moving Image, Physical Object, Service, Software, Sound, Still Image, Text" },
        ],
      },
      rda: {
        field: "RDA 6.3 / 7.2",
        label: "Form of work / Content type",
        match: "partial",
        note: "RDA separates form of work from content type. Together they approximate MARC 655, but mapping is not one-to-one.",
        elements: [
          { code: "6.3", desc: "Form of work", note: "e.g., novel, poem, play, film" },
          { code: "7.2", desc: "Content type (Core)", note: "text, performed music, cartographic image, etc." },
          { code: "7.3", desc: "Media type (Core)", note: "audio, computer, microform, unmediated, video" },
          { code: "7.4", desc: "Carrier type (Core)", note: "online resource, volume, audio disc, etc." },
        ],
      },
      bibframe: {
        field: "bf:genreForm",
        label: "Genre/Form",
        match: "exact",
        note: "bf:GenreForm as a typed resource linking to vocabulary URIs (LCGFT, SAOGF). Clean mapping from MARC 655.",
        elements: [
          { code: "bf:genreForm", desc: "Genre/form property (on Work or Instance)" },
          { code: "bf:GenreForm", desc: "Genre/form class" },
          { code: "bf:source", desc: "Source vocabulary (property)", note: "Links to LCGFT, SAOGF, etc." },
          { code: "bf:content", desc: "Content type (separate from genre)" },
          { code: "bf:media", desc: "Media type" },
          { code: "bf:carrier", desc: "Carrier type" },
        ],
      },
    },
    systemNotes: [
      {
        system: "Koha",
        issue: "Koha's advanced search has no dedicated genre/form facet by default. 655 data is indexed but libraries need to configure a custom search index and OPAC facet to make genre/form browsable.",
      },
      {
        system: "Libris XL",
        issue: "Libris XL supports SAOGF (Svenska ämnesord — genre/form) in 655 with $2 saogf. Genre/form is well-integrated in the discovery interface. However, older records may have genre terms in 650 (topical) instead of 655.",
      },
    ],
    realWorldExamples: [
      {
        scenario: "Genre vs. subject confusion in legacy data",
        problem: "Pre-2010 MARC 21 records often coded 'Science fiction' as a 650 topical subject instead of a 655 genre/form. When these records are crosswalked, 'Science fiction' appears as a topic (what the book is ABOUT) rather than a form (what the book IS). A search for 'books about science fiction' returns science fiction novels, which is wrong.",
        impact: "The about/is distinction — fundamental to modern cataloging — is silently corrupted in legacy crosswalks.",
      },
    ],
  },
];


/* =========================================================================
   COLOUR SYSTEM — 5 core + functional semantics
   Core: Coffee Bean, Shadow Grey, Twilight, Golden Earth, Warm White
   Everything else derived via opacity or slight adjustment
   ========================================================================= */


/* =========================================================================
   NEUMORPHIC SHADOWS
   ========================================================================= */
const NEU = {
  raised:       "6px 6px 14px rgba(180,174,155,0.35), -6px -6px 14px rgba(255,255,255,0.75)",
  raisedSm:     "3px 3px 8px rgba(180,174,155,0.28), -3px -3px 8px rgba(255,255,255,0.65)",
  raisedHover:  "8px 8px 20px rgba(180,174,155,0.40), -8px -8px 20px rgba(255,255,255,0.85)",
  inset:        "inset 3px 3px 7px rgba(180,174,155,0.32), inset -3px -3px 7px rgba(255,255,255,0.70)",
  insetDeep:    "inset 4px 4px 10px rgba(180,174,155,0.38), inset -4px -4px 10px rgba(255,255,255,0.75)",
  darkRaised:   "5px 5px 12px rgba(0,0,0,0.5), -5px -5px 12px rgba(26,9,5,0.35)",
  darkRaisedSm: "3px 3px 7px rgba(0,0,0,0.45), -3px -3px 7px rgba(26,9,5,0.30)",
  darkInset:    "inset 3px 3px 7px rgba(0,0,0,0.5), inset -3px -3px 7px rgba(26,9,5,0.30)",
  darkInsetDeep:"inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(26,9,5,0.35)",
};

/* =========================================================================
   RESPONSIVE HOOK
   ========================================================================= */
const useWindowWidth = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
};

/* =========================================================================
   SEARCH INDEX
   ========================================================================= */
const buildSearchIndex = () => {
  const entries = [];
  CONCEPTS.forEach((concept) => {
    STANDARDS.forEach((std) => {
      const m = concept.mappings[std.id];
      if (!m) return;
      const text = [m.field, m.label, m.note || ""].join(" ").toLowerCase();
      const codes = [...(m.subfields || []), ...(m.elements || [])].map(s => s.code || "").join(" ").toLowerCase();
      entries.push({
        conceptId: concept.id, conceptLabel: concept.label,
        standardId: std.id, standardLabel: std.label,
        field: m.field, match: m.match,
        searchText: text + " " + codes + " " + concept.label.toLowerCase(),
      });
    });
  });
  return entries;
};

/* =========================================================================
   SOURCE REFERENCES
   ========================================================================= */
const SOURCES = [
  { label: "MARC 21 Bibliographic", url: "https://www.loc.gov/marc/bibliographic/", org: "Library of Congress" },
  { label: "UNIMARC Bibliographic", url: "https://www.ifla.org/references/best-practice-for-national-bibliographic-agencies-in-a-digital-age/resource-description-and-standards/bibliographic-data/unimarc/", org: "IFLA" },
  { label: "Dublin Core Metadata Terms", url: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/", org: "DCMI" },
  { label: "RDA Toolkit", url: "https://access.rdatoolkit.org/", org: "RDA Steering Committee" },
  { label: "BIBFRAME 2.0 Vocabulary", url: "https://id.loc.gov/ontologies/bibframe.html", org: "Library of Congress" },
  { label: "LC MARC to BIBFRAME Specs", url: "https://www.loc.gov/bibframe/mtbf/", org: "Library of Congress" },
  { label: "LC MARC/Dublin Core Crosswalk", url: "https://www.loc.gov/marc/marc2dc.html", org: "Library of Congress" },
  { label: "KB Metadatabyr\u00e5n", url: "https://metadatabyran.kb.se/", org: "Kungliga biblioteket" },
  { label: "Svenska \u00e4mnesord (SAO)", url: "https://id.kb.se/", org: "Kungliga biblioteket" },
];

/* =========================================================================
   SMALL COMPONENTS
   ========================================================================= */
const MatchBadge = ({ type, small }) => {
  const m = MATCH[type] || MATCH.none;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: small ? 4 : 6,
      padding: small ? "3px 10px" : "5px 14px", borderRadius: 100,
      fontSize: small ? 10 : 11,
      fontFamily: "'Roboto Flex', sans-serif", fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
      color: m.color, background: C.surface, boxShadow: NEU.raisedSm,
    }}>
      <span style={{ fontSize: small ? 7 : 9 }}>{m.icon}</span>{m.label}
    </span>
  );
};

const SubfieldList = ({ items, type }) => {
  if (!items || items.length === 0) return null;
  const label = type === "subfields" ? "Subfields" : type === "indicators" ? "Indicators" : "Elements & Properties";
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        fontWeight: 700, color: C.textMuted, marginBottom: 10,
        fontFamily: "'Roboto Flex', sans-serif",
      }}>{label}</div>
      <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: NEU.inset, background: C.surface, padding: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "9px 16px", fontSize: 12.5,
            fontFamily: "'Roboto Flex', sans-serif", lineHeight: 1.6, alignItems: "baseline",
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12,
              color: C.accent, fontWeight: 700,
              minWidth: type === "indicators" ? 60 : 80, flexShrink: 0, whiteSpace: "nowrap",
            }}>{item.code || item.pos || "\u2014"}</span>
            <span style={{ color: C.dark, flex: 1 }}>
              {item.desc || item.label}
              {(item.values || item.note) && (
                <span style={{ color: C.textMuted, fontSize: 11, display: "block", marginTop: 2 }}>{item.values || item.note}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoCard = ({ accentColor, label, children }) => (
  <div style={{
    padding: "22px 26px", margin: "14px 0", borderRadius: 16,
    background: C.surface, boxShadow: NEU.raised,
    fontFamily: "'Roboto Flex', sans-serif", fontSize: 13, lineHeight: 1.7,
    borderLeft: `4px solid ${accentColor}`,
  }}>
    <div style={{
      fontWeight: 700, fontSize: 10, letterSpacing: "0.1em",
      textTransform: "uppercase", color: accentColor, marginBottom: 10,
    }}>{label}</div>
    {children}
  </div>
);

const SystemNote = ({ note }) => (
  <InfoCard accentColor={C.primary} label={note.system}>
    <div style={{ color: C.dark }}>{note.issue}</div>
  </InfoCard>
);

const RealWorldExample = ({ example }) => (
  <InfoCard accentColor={C.espresso} label={example.scenario}>
    <div style={{ color: C.dark, marginBottom: 12 }}>{example.problem}</div>
    <div style={{
      fontSize: 12, color: C.espresso, fontWeight: 500,
      paddingTop: 12, borderTop: `1px solid ${C.border}`, fontStyle: "italic",
    }}>Impact: {example.impact}</div>
  </InfoCard>
);

const ClassificationPanel = ({ systems }) => {
  if (!systems) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {Object.entries(systems).map(([key, sys]) => (
        <InfoCard key={key} accentColor={C.accent} label={sys.label}>
          <div style={{ color: C.dark, marginBottom: 10 }}>{sys.note}</div>
          <span style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.accent,
            background: C.surface, padding: "6px 12px", borderRadius: 8,
            display: "inline-block", boxShadow: NEU.inset,
          }}>{sys.example}</span>
        </InfoCard>
      ))}
    </div>
  );
};

const MappingCard = ({ standard, mapping, isMobile }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = (mapping.subfields?.length > 0) || (mapping.indicators?.length > 0) || (mapping.elements?.length > 0);
  return (
    <div
      onClick={() => hasDetail && setExpanded(!expanded)}
      style={{
        background: C.surface, borderRadius: 18,
        padding: isMobile ? "20px" : "26px 30px",
        boxShadow: expanded ? NEU.insetDeep : NEU.raised,
        cursor: hasDetail ? "pointer" : "default",
        transition: "box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.boxShadow = NEU.raisedHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = expanded ? NEU.insetDeep : NEU.raised; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{
          fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          fontWeight: 700, color: C.textMuted, fontFamily: "'Roboto Flex', sans-serif",
        }}>
          {standard.label} <span style={{ fontWeight: 400, color: C.textMuted + "88" }}>{"\u00b7"} {standard.sub}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MatchBadge type={mapping.match} small={isMobile} />
          {hasDetail && (
            <span style={{
              width: 24, height: 24, borderRadius: 8,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: C.textMuted, background: C.surface,
              boxShadow: expanded ? NEU.inset : NEU.raisedSm,
              transition: "all 0.25s ease", userSelect: "none",
            }}>
              <span style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", display: "inline-block" }}>{"\u25be"}</span>
            </span>
          )}
        </div>
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: isMobile ? 12.5 : 14.5,
        color: C.dark, fontWeight: 700, lineHeight: 1.4, marginBottom: 14,
        padding: isMobile ? "8px 12px" : "10px 16px",
        background: C.surface, borderRadius: 10, boxShadow: NEU.inset,
        overflowX: "auto",
      }}>{mapping.field}</div>
      <div style={{
        fontFamily: "'Roboto Flex', sans-serif", fontSize: 13, lineHeight: 1.7, color: C.textBody,
      }}>{mapping.note}</div>
      {expanded && (
        <div style={{ marginTop: 20 }}>
          {mapping.indicators && <SubfieldList items={mapping.indicators} type="indicators" />}
          {mapping.subfields && <SubfieldList items={mapping.subfields} type="subfields" />}
          {mapping.elements && <SubfieldList items={mapping.elements} type="elements" />}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   CROSSWALK TABLE — responsive
   ========================================================================= */
const CrosswalkTable = ({ sourceId, targetId, isMobile }) => {
  const source = STANDARDS.find(s => s.id === sourceId);
  const target = STANDARDS.find(s => s.id === targetId);
  if (!source || !target) return null;

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CONCEPTS.map((concept) => {
          const sm = concept.mappings[sourceId];
          const tm = concept.mappings[targetId];
          if (!sm || !tm) return null;
          const matchOrder = { exact: 0, partial: 1, contextual: 2, lossy: 3, none: 4 };
          const worstMatch = matchOrder[sm.match] > matchOrder[tm.match] ? sm.match : tm.match;
          return (
            <div key={concept.id} style={{
              padding: 20, borderRadius: 16, background: C.surface, boxShadow: NEU.raised,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: 14, fontFamily: "'Roboto Flex', sans-serif" }}>{concept.label}</span>
                <MatchBadge type={worstMatch} small />
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Roboto Flex', sans-serif", marginBottom: 6, fontWeight: 600 }}>{source.label}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 12 }}>{sm.field.split(" - ")[0]}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Roboto Flex', sans-serif", marginBottom: 6, fontWeight: 600 }}>{target.label}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.primary, fontWeight: 600 }}>{tm.field.split(" - ")[0]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: NEU.raised, background: C.surface }}>
      <div style={{
        display: "grid", gridTemplateColumns: "150px 1fr 100px 1fr",
        background: C.mid, color: C.card, padding: "14px 24px", fontSize: 10,
        fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        fontFamily: "'Roboto Flex', sans-serif",
      }}>
        <span>Concept</span><span>{source.label}</span>
        <span style={{ textAlign: "center" }}>Match</span><span>{target.label}</span>
      </div>
      {CONCEPTS.map((concept) => {
        const sm = concept.mappings[sourceId]; const tm = concept.mappings[targetId];
        if (!sm || !tm) return null;
        const matchOrder = { exact: 0, partial: 1, contextual: 2, lossy: 3, none: 4 };
        const worstMatch = matchOrder[sm.match] > matchOrder[tm.match] ? sm.match : tm.match;
        return (
          <div key={concept.id} style={{
            display: "grid", gridTemplateColumns: "150px 1fr 100px 1fr",
            padding: "14px 24px", fontSize: 13, fontFamily: "'Roboto Flex', sans-serif",
            background: C.surface, borderBottom: `1px solid ${C.border}`, alignItems: "center",
          }}>
            <span style={{ fontWeight: 600, color: C.dark, fontSize: 12 }}>{concept.label}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.primary, fontWeight: 600 }}>{sm.field.split(" - ")[0]}</span>
            <span style={{ textAlign: "center" }}><MatchBadge type={worstMatch} small /></span>
            <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.primary, fontWeight: 600 }}>{tm.field.split(" - ")[0]}</span>
          </div>
        );
      })}
      <div style={{
        padding: "18px 24px", background: C.accent + "12", fontSize: 12,
        color: C.textBody, fontFamily: "'Roboto Flex', sans-serif",
      }}>
        <span style={{ fontWeight: 700, color: C.espresso }}>Data loss: </span>
        {(() => {
          let l = 0, n = 0, p = 0;
          CONCEPTS.forEach(c => { const t = c.mappings[targetId]; if (t?.match === "lossy") l++; if (t?.match === "none") n++; if (t?.match === "partial") p++; });
          const r = []; if (n) r.push(`${n} no equivalent`); if (l) r.push(`${l} lossy`); if (p) r.push(`${p} partial`);
          return r.length ? r.join(" \u00b7 ") : "All fields map cleanly";
        })()}
      </div>
    </div>
  );
};

/* =========================================================================
   SEARCH RESULTS — responsive
   ========================================================================= */
const SearchResults = ({ query, onNavigate, isMobile }) => {
  const index = buildSearchIndex();
  const q = query.toLowerCase().trim();
  const results = index.filter(e => e.searchText.includes(q));

  if (results.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", fontFamily: "'Roboto Flex', sans-serif", color: C.textMuted }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: C.surface, boxShadow: NEU.insetDeep }}>?</div>
        <div style={{ fontSize: 14 }}>No fields matching "{query}"</div>
        <div style={{ fontSize: 12, marginTop: 8, color: C.textMuted + "88" }}>Try a field number (245, 650), subfield ($a), or keyword</div>
      </div>
    );
  }

  const grouped = {};
  results.forEach(r => { if (!grouped[r.conceptId]) grouped[r.conceptId] = { label: r.conceptLabel, items: [] }; grouped[r.conceptId].items.push(r); });

  return (
    <div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24, fontFamily: "'Roboto Flex', sans-serif" }}>
        {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
      </div>
      {Object.entries(grouped).map(([id, group]) => (
        <div key={id} style={{ marginBottom: 28 }}>
          <div onClick={() => onNavigate(id)} style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 600,
            color: C.primary, marginBottom: 14, cursor: "pointer",
          }}>{group.label} <span style={{ fontSize: 12, fontFamily: "'Roboto Flex', sans-serif", color: C.textMuted, fontWeight: 400 }}>{"\u2192"} view all</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {group.items.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: isMobile ? 10 : 16,
                padding: isMobile ? "12px 16px" : "14px 22px",
                background: C.surface, borderRadius: 14, boxShadow: NEU.raisedSm,
                fontFamily: "'Roboto Flex', sans-serif", fontSize: 13, flexWrap: isMobile ? "wrap" : "nowrap",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, minWidth: 80 }}>{item.standardLabel}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12, color: C.dark, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{item.field}</span>
                <MatchBadge type={item.match} small />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* =========================================================================
   INTRO / LANDING SECTION
   ========================================================================= */
const IntroSection = ({ onStart, isMobile }) => (
  <div style={{
    padding: isMobile ? "40px 24px" : "60px 48px",
    background: C.surface, maxWidth: 800,
  }}>
    <div style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: isMobile ? 26 : 34, fontWeight: 600, color: C.dark,
      lineHeight: 1.2, marginBottom: 20,
    }}>
      Navigate the spaces between metadata standards
    </div>
    <div style={{
      fontFamily: "'Roboto Flex', sans-serif", fontSize: 14,
      color: C.textBody, lineHeight: 1.8, marginBottom: 28, maxWidth: 600,
    }}>
      This tool maps how bibliographic concepts translate between UNIMARC, MARC 21, Dublin Core, RDA, and BIBFRAME 2.0. It shows exactly where data is preserved, degraded, or lost during conversions, with practical system notes from Koha and Libris XL environments.
    </div>

    <div style={{
      fontFamily: "'Roboto Flex', sans-serif", fontSize: 13,
      color: C.textBody, lineHeight: 1.8, marginBottom: 32,
    }}>
      Built for catalogers planning system migrations, metadata librarians working across standards, LIS students learning how bibliographic frameworks relate, and anyone who has wondered why information disappears when records move between systems.
    </div>

    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
      <button onClick={onStart} style={{
        padding: "12px 28px", borderRadius: 14, border: "none",
        background: C.surface, boxShadow: NEU.raised,
        fontFamily: "'Roboto Flex', sans-serif", fontSize: 13,
        fontWeight: 700, color: C.primary, cursor: "pointer",
        transition: "all 0.2s ease",
      }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = NEU.inset}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = NEU.raised}
      >Start exploring {"\u2192"}</button>
    </div>

    {/* Methodology */}
    <div style={{
      padding: "24px 28px", borderRadius: 16,
      background: C.surface, boxShadow: NEU.raised,
      marginBottom: 28,
    }}>
      <div style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        fontWeight: 700, color: C.accent, marginBottom: 12,
        fontFamily: "'Roboto Flex', sans-serif",
      }}>Methodology & Sources</div>
      <div style={{ fontFamily: "'Roboto Flex', sans-serif", fontSize: 13, color: C.textBody, lineHeight: 1.8 }}>
        Field mappings are based on official crosswalk documentation from the Library of Congress, IFLA, and the DCMI, cross-referenced with professional cataloging experience across UNIMARC and MARC 21 environments in Portugal and Sweden. System-specific notes reflect direct experience with Koha (open-source ILS) and Libris XL (KB Sweden's national library system). RDA mappings follow the current RDA Toolkit. All match quality assessments (exact, partial, lossy, no equivalent) indicate the degree of semantic preservation during conversion.
      </div>
    </div>

    {/* Sources grid */}
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 10,
    }}>
      {SOURCES.map((s, i) => (
        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 12,
          background: C.surface, boxShadow: NEU.raisedSm,
          textDecoration: "none", transition: "all 0.2s ease",
          fontFamily: "'Roboto Flex', sans-serif",
        }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = NEU.inset}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = NEU.raisedSm}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>{s.label}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{s.org}</div>
          </div>
          <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 12 }}>{"\u2197"}</span>
        </a>
      ))}
    </div>
  </div>
);

/* =========================================================================
   MAIN APP
   ========================================================================= */

export default function MetadataCrosswalkVisualizer() {
  const [selectedConcept, setSelectedConcept] = useState("title");
  const [showSection, setShowSection] = useState("mappings");
  const [viewMode, setViewMode] = useState("intro"); // "intro" | "explore" | "crosswalk" | "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [crosswalkSource, setCrosswalkSource] = useState("marc21");
  const [crosswalkTarget, setCrosswalkTarget] = useState("dc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const detailRef = useRef(null);
  const width = useWindowWidth();
  const isMobile = width < 900;

  const concept = CONCEPTS.find((c) => c.id === selectedConcept);
  const descriptive = CONCEPTS.filter((c) => c.group === "descriptive");
  const subject = CONCEPTS.filter((c) => c.group === "subject");
  const GITHUB_REPO = "https://github.com/luziaantunes/metadata-crosswalk-visualizer";

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedConcept, viewMode]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (val.trim().length > 0) setViewMode("search");
    else if (viewMode === "search") setViewMode("explore");
  };

  const navigateToConcept = (id) => {
    setSelectedConcept(id);
    setViewMode("explore");
    setSearchQuery("");
    setShowSection("mappings");
    if (isMobile) setSidebarOpen(false);
  };

  /* ── Sidebar button ── */
  const SidebarBtn = ({ c }) => {
    const active = selectedConcept === c.id && viewMode === "explore";
    return (
      <button onClick={() => navigateToConcept(c.id)} style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "calc(100% - 32px)", margin: "4px 16px", padding: "10px 14px",
        border: "none", borderRadius: 12, background: C.dark,
        boxShadow: active ? NEU.darkInset : NEU.darkRaisedSm,
        cursor: "pointer", fontFamily: "'Roboto Flex', sans-serif", fontSize: 13,
        color: active ? C.accent : "#9A9A96",
        fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.25s ease",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: active ? C.accent : C.dark,
          color: active ? C.dark : "#7A7A76",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, flexShrink: 0,
          boxShadow: active ? NEU.darkInset : NEU.darkRaisedSm,
        }}>{c.icon}</span>
        {c.label}
      </button>
    );
  };

  /* ── Tab button ── */
  const TabBtn = ({ tab }) => {
    const active = showSection === tab.key;
    return (
      <button onClick={() => setShowSection(tab.key)} style={{
        padding: isMobile ? "8px 14px" : "10px 20px", border: "none", borderRadius: 12,
        background: C.surface, boxShadow: active ? NEU.inset : NEU.raisedSm,
        fontFamily: "'Roboto Flex', sans-serif", fontSize: isMobile ? 11 : 12,
        fontWeight: active ? 700 : 400, color: active ? C.primary : C.textMuted,
        cursor: "pointer", transition: "all 0.2s ease",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {tab.label}
        <span style={{ fontSize: 10, color: active ? C.accent : C.textMuted, fontWeight: 700 }}>{tab.count}</span>
      </button>
    );
  };

  /* ── Select box ── */
  const Sel = ({ value, onChange, options, label }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: C.textMuted, fontFamily: "'Roboto Flex', sans-serif" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        padding: "10px 16px", borderRadius: 12, border: "none",
        background: C.surface, boxShadow: NEU.inset,
        fontFamily: "'Roboto Flex', sans-serif", fontSize: 13,
        color: C.dark, fontWeight: 600, cursor: "pointer", outline: "none",
      }}>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );

  /* ── Mode toggle ── */
  const modes = [
    { key: "explore", label: "Explore" },
    { key: "crosswalk", label: isMobile ? "Compare" : "Source \u2192 Target" },
  ];

  /* ── Sidebar content (reused for both desktop and mobile drawer) ── */
  const SidebarContent = () => (
    <>
      <div style={{
        margin: "0 16px 14px", padding: "8px 14px", fontSize: 9,
        letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700,
        color: C.accent, borderRadius: 8, background: C.dark, boxShadow: NEU.darkInset,
      }}>Descriptive</div>
      {descriptive.map((c) => <SidebarBtn key={c.id} c={c} />)}
      <div style={{ margin: "20px 24px", height: 2, borderRadius: 1, background: C.dark, boxShadow: "0 1px 1px rgba(50,42,42,0.3), 0 -1px 1px rgba(0,0,0,0.4)" }} />
      <div style={{
        margin: "0 16px 14px", padding: "8px 14px", fontSize: 9,
        letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700,
        color: C.accent, borderRadius: 8, background: C.dark, boxShadow: NEU.darkInset,
      }}>Subject Access</div>
      {subject.map((c) => <SidebarBtn key={c.id} c={c} />)}
    </>
  );

  return (
    <div style={{ fontFamily: "'Roboto Flex', sans-serif", background: C.surface, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Fonts loaded via index.html — Cormorant Garamond · IBM Plex Mono · Roboto Flex */}

      {/* ── HEADER ── */}
      <header style={{ background: C.mid, color: C.card, padding: isMobile ? "20px" : "28px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Hamburger for mobile */}
              {isMobile && viewMode !== "intro" && (
                <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                  background: C.mid, border: "none", boxShadow: sidebarOpen ? NEU.darkInset : NEU.darkRaisedSm,
                  borderRadius: 10, width: 40, height: 40, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: C.accent, transition: "all 0.2s ease",
                }}>{sidebarOpen ? "\u2715" : "\u2630"}</button>
              )}
              <div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: isMobile ? 18 : 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 2,
                }}>Metadata Crosswalk Visualizer</div>
                {!isMobile && (
                  <div style={{ fontSize: 12, color: "#9A9A96", lineHeight: 1.5 }}>
                    UNIMARC {"\u00b7"} MARC 21 {"\u00b7"} Dublin Core {"\u00b7"} RDA {"\u00b7"} BIBFRAME 2.0
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            {viewMode !== "intro" && (
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : 260, maxWidth: 320 }}>
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search (245, $a, series...)"
                  style={{
                    width: "100%", padding: "10px 16px 10px 38px", borderRadius: 14, border: "none",
                    background: C.mid, color: C.card, boxShadow: NEU.darkInsetDeep,
                    fontFamily: "'Roboto Flex', sans-serif", fontSize: 13, outline: "none",
                  }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.3, color: C.card }}>{"\u2315"}</span>
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setViewMode("explore"); }} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#9A9A96", cursor: "pointer", fontSize: 16,
                  }}>{"\u00d7"}</button>
                )}
              </div>
            )}
          </div>

          {/* Mode toggle + legend */}
          {viewMode !== "intro" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {modes.map((mode, i) => {
                  const active = viewMode === mode.key || (viewMode === "search" && mode.key === "explore");
                  return (
                    <button key={mode.key} onClick={() => { setViewMode(mode.key); setSearchQuery(""); }} style={{
                      padding: "8px 18px", border: "none",
                      borderRadius: i === 0 ? "10px 0 0 10px" : "0 10px 10px 0",
                      background: C.mid, boxShadow: active ? NEU.darkInset : NEU.darkRaisedSm,
                      color: active ? C.accent : "#9A9A96",
                      fontFamily: "'Roboto Flex', sans-serif", fontSize: 11, fontWeight: active ? 700 : 500,
                      letterSpacing: "0.04em", cursor: "pointer", transition: "all 0.2s ease",
                    }}>{mode.label}</button>
                  );
                })}
                <button onClick={() => setViewMode("intro")} style={{
                  padding: "8px 14px", border: "none", borderRadius: "0 0 0 0",
                  background: C.mid, boxShadow: NEU.darkRaisedSm, marginLeft: 8, borderRadius: 10,
                  color: "#9A9A96", fontFamily: "'Roboto Flex', sans-serif", fontSize: 11,
                  fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em",
                }}>About</button>
              </div>
              {!isMobile && (
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  {Object.entries(MATCH).map(([key, m]) => (
                    <span key={key} style={{ fontSize: 11, color: m.color, display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>{m.icon}</span>{m.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "flex", flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", position: "relative" }}>

        {/* ── SIDEBAR — desktop: always visible; mobile: overlay drawer ── */}
        {viewMode !== "intro" && (isMobile ? sidebarOpen : true) && (
          <nav style={{
            width: isMobile ? "280px" : 250, minWidth: isMobile ? "280px" : 250,
            background: C.dark, padding: "28px 0",
            overflowY: "auto", maxHeight: "calc(100vh - 160px)",
            ...(isMobile ? {
              position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 100,
              boxShadow: "8px 0 24px rgba(0,0,0,0.3)",
            } : {}),
          }}>
            <SidebarContent />
          </nav>
        )}

        {/* Mobile overlay backdrop */}
        {isMobile && sidebarOpen && viewMode !== "intro" && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)", zIndex: 99,
          }} />
        )}

        {/* ── CONTENT AREA ── */}
        <main ref={detailRef} style={{
          flex: 1, padding: isMobile ? "24px 20px 48px" : "40px 48px 64px",
          overflowY: "auto", maxHeight: viewMode === "intro" ? "none" : "calc(100vh - 160px)",
          background: C.surface,
        }}>

          {viewMode === "intro" && <IntroSection onStart={() => setViewMode("explore")} isMobile={isMobile} />}

          {viewMode === "search" && <SearchResults query={searchQuery} onNavigate={navigateToConcept} isMobile={isMobile} />}

          {viewMode === "crosswalk" && (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 22 : 26, fontWeight: 600, color: C.dark, marginBottom: 8 }}>
                Source {"\u2192"} Target Crosswalk
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 28, lineHeight: 1.5 }}>
                Compare field mappings and identify data loss between two standards.
              </div>
              <div style={{
                display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap",
                padding: isMobile ? "20px" : "24px 28px", borderRadius: 18, background: C.surface, boxShadow: NEU.raised,
              }}>
                <Sel label="Source" value={crosswalkSource} onChange={setCrosswalkSource} options={STANDARDS} />
                <span style={{ fontSize: 20, color: C.accent, fontWeight: 300, paddingBottom: 8 }}>{"\u2192"}</span>
                <Sel label="Target" value={crosswalkTarget} onChange={setCrosswalkTarget} options={STANDARDS} />
                {crosswalkSource === crosswalkTarget && (
                  <span style={{ fontSize: 12, color: C.espresso, fontStyle: "italic", paddingBottom: 10 }}>Select two different standards</span>
                )}
              </div>
              {crosswalkSource !== crosswalkTarget && <CrosswalkTable sourceId={crosswalkSource} targetId={crosswalkTarget} isMobile={isMobile} />}
            </div>
          )}

          {viewMode === "explore" && (
            <>
              <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 24 : 30, fontWeight: 600, color: C.dark, letterSpacing: "-0.01em", marginBottom: 6 }}>
                    {concept.label}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                    Mapping across 5 standards{concept.classificationSystems ? " + 3 classification systems" : ""}
                  </div>
                </div>
                <a href={`${GITHUB_REPO}/issues/new?title=Correction:+${encodeURIComponent(concept.label)}&labels=data-correction&body=Concept:+${encodeURIComponent(concept.label)}%0A%0ADescribe+the+correction+or+addition:`}
                  target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12,
                    border: "none", background: C.surface, boxShadow: NEU.raisedSm,
                    fontFamily: "'Roboto Flex', sans-serif", fontSize: 11, color: C.textMuted,
                    textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = NEU.inset; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = NEU.raisedSm; e.currentTarget.style.color = C.textMuted; }}
                ><span style={{ fontSize: 13 }}>{"\u270E"}</span> Suggest correction</a>
              </div>

              <div style={{ display: "flex", marginBottom: 32, flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "mappings", label: "Mappings", count: 5 },
                  { key: "systems", label: "Systems", count: concept.systemNotes?.length || 0 },
                  { key: "examples", label: "Issues", count: concept.realWorldExamples?.length || 0 },
                  ...(concept.classificationSystems ? [{ key: "classifications", label: "Classification", count: 3 }] : []),
                ].map((tab) => <TabBtn key={tab.key} tab={tab} />)}
              </div>

              {showSection === "mappings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {STANDARDS.map((std) => concept.mappings[std.id] ? <MappingCard key={std.id} standard={std} mapping={concept.mappings[std.id]} isMobile={isMobile} /> : null)}
                </div>
              )}
              {showSection === "systems" && (
                <div>
                  <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6, fontStyle: "italic" }}>Based on professional experience with Koha and Libris XL.</p>
                  {concept.systemNotes?.map((n, i) => <SystemNote key={i} note={n} />)}
                </div>
              )}
              {showSection === "examples" && (
                <div>
                  <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6, fontStyle: "italic" }}>Concrete scenarios where crosswalk limitations cause real problems.</p>
                  {concept.realWorldExamples?.map((ex, i) => <RealWorldExample key={i} example={ex} />)}
                </div>
              )}
              {showSection === "classifications" && concept.classificationSystems && <ClassificationPanel systems={concept.classificationSystems} />}
            </>
          )}
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: isMobile ? "16px 20px" : "20px 40px", background: C.dark,
        textAlign: "center", fontFamily: "'Roboto Flex', sans-serif",
        fontSize: 12, color: "#7A7A76", borderTop: `1px solid ${C.mid}`,
      }}>
        Built by <span style={{ color: C.accent, fontWeight: 700 }}>Luzia Verdasca Antunes</span>
        {" "}{"\u2014"} Metadata Specialist {"\u00b7"} 20 years across UNIMARC & MARC 21 {"\u00b7"}{" "}
        <a href="https://github.com/luziaantunes" target="_blank" rel="noopener noreferrer" style={{
          color: C.accent, textDecoration: "none", borderBottom: `1px solid ${C.accent}30`,
        }}>GitHub</a>
      </footer>
    </div>
  );
}
