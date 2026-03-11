# Metadata Crosswalk Visualizer

A visual, standards‑aware tool for understanding how bibliographic metadata maps — and degrades — across major library metadata frameworks.

The **Metadata Crosswalk Visualizer** shows how core bibliographic concepts translate between **UNIMARC**, **MARC 21**, **Dublin Core**, **RDA**, and **BIBFRAME 2.0**, highlighting where data is preserved, partially preserved, or irretrievably lost during conversion.

It is designed for metadata professionals who need more than generic crosswalk tables: it exposes *structure*, *semantics*, and *real‑world system consequences*.

---

## ✨ Key Features

- **Concept‑based navigation**  
  Explore mappings by bibliographic concept (Title, Creator, Subject, Identifier, etc.), not just by field number.

- **Five‑standard comparison**  
  Side‑by‑side mappings across:
  - UNIMARC
  - MARC 21
  - Dublin Core (Simple & Qualified)
  - RDA
  - BIBFRAME 2.0

- **Match quality indicators**  
  Each mapping is classified as:
  - **Exact** – semantic structure preserved
  - **Partial** – some loss or flattening
  - **Context‑dependent** – meaning depends on implementation
  - **Lossy** – significant semantic loss
  - **No equivalent**

- **System‑level notes**  
  Practical observations from real systems, including **Koha** and **Libris XL**, documenting where migrations and exports fail in practice.

- **Real‑world problem scenarios**  
  Concrete examples of how crosswalk limitations affect discovery, authority control, multilingual data, and classification integrity.

- **Interactive crosswalk mode**  
  Compare a *source* standard against a *target* standard to immediately see where and how data loss occurs.

- **Full‑text search**  
  Search by field number (e.g. `245`, `650`), subfield (`$a`), element name, or keyword.

---

## 🎯 Who This Is For

- Metadata librarians and catalogers
- Library systems and migration teams
- LIS educators and students
- Developers working with library metadata
- Anyone designing or evaluating metadata crosswalks

This tool assumes familiarity with bibliographic standards and is intentionally explicit about technical detail.

---

## 🧭 Design Principles

- **Concepts over fields**  
  Users think in *Title*, *Creator*, *Subject* — not just `245` or `dc:title`.

- **Semantic honesty**  
  Not all mappings are equal. The tool makes data loss visible instead of hiding it.

- **Standards‑first**  
  Mappings are grounded in official documentation (LC, IFLA, DCMI, RDA Toolkit), cross‑checked against professional practice.

- **System reality matters**  
  What works “on paper” often fails in ILS, LSP, or aggregation environments.

---

## 🛠️ Technology

- **React** (single‑page application)
- No backend
- No external dependencies beyond React
- Designed to be embedded in a larger React app or deployed as a static site

The main implementation lives in a single component file:
