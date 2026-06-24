import { useState, useEffect, useRef } from "react";
import { CONCEPTS } from "./crosswalk-data.js";

const C = {
  // Unified Brand Spec — "Archive Aesthetic" (2026-06-24, canonical)
  dark:      "#1a0905",  // Coffee Bean — The Ink / body text
  mid:       "#2e1008",  // Coffee Bean darkened — header surfaces
  primary:   "#4c050d",  // Night Bordeaux — The Stamp / interactive, links, CTA
  accent:    "#94b1c8",  // Powder Blue — The Folder / data, highlights (not text)
  surface:   "#f1ede4",  // Soft Linen — The Canvas / background
  // Derived
  card:      "#f7f4ec",  // Soft Linen lifted — card backgrounds
  textBody:  "#5c4840",  // Muted Brown — secondary / body text
  textMuted: "#8c7a70",  // Muted Brown lightened — captions
  border:    "#d6d1be",  // Linen Dark — borders / alt sections
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



/* =========================================================================
   COLOUR SYSTEM — Unified Brand Spec "Archive Aesthetic" (see C above)
   Soft Linen · Coffee Bean · Night Bordeaux · Powder Blue · Linen Dark ·
   Muted Brown — plus functional data-viz semantics. Derived via slight tints.
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
        color: active ? C.accent : C.textMuted,
        fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.25s ease",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: active ? C.accent : C.dark,
          color: active ? C.dark : C.textMuted,
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
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
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
                    background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16,
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
                      color: active ? C.accent : C.textMuted,
                      fontFamily: "'Roboto Flex', sans-serif", fontSize: 11, fontWeight: active ? 700 : 500,
                      letterSpacing: "0.04em", cursor: "pointer", transition: "all 0.2s ease",
                    }}>{mode.label}</button>
                  );
                })}
                <button onClick={() => setViewMode("intro")} style={{
                  padding: "8px 14px", border: "none", borderRadius: "0 0 0 0",
                  background: C.mid, boxShadow: NEU.darkRaisedSm, marginLeft: 8, borderRadius: 10,
                  color: C.textMuted, fontFamily: "'Roboto Flex', sans-serif", fontSize: 11,
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
        fontSize: 12, color: C.textMuted, borderTop: `1px solid ${C.mid}`,
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
