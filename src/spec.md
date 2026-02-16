# Specification

## Summary
**Goal:** Enhance Party Payment Manager reporting and usability with PDF/CSV export, print-friendly reports, and basic All Entries search/filter/sort.

**Planned changes:**
- Add “Export PDF” in the Report view to download a PDF of the currently selected party’s currently filtered report rows (including party name, generation date/time, and table columns).
- Add a “Print” action and print-friendly styling for the Report view so printing includes only the report content (title + table) with readable page formatting.
- Add “Export CSV” actions: (a) in Report view for the selected party’s filtered rows, and (b) in All Entries view for all currently loaded entries, with human-readable headers and phone numbers preserved as text.
- Improve All Entries with client-side text search (by Party Name), a “Due Today” filter toggle, and client-side sorting by Date and Party Name.

**User-visible outcome:** Users can export party reports to PDF/CSV, print clean reports from the browser, export all entries to CSV, and more easily find and organize entries in All Entries via search, “Due Today” filtering, and sorting.
