# Brainstorming Session — Decisions Log
**Date:** 2026-06-30

Quick record of design questions asked and answers given during the planning session.

---

**Q1: How to handle Kayak API CORS?**  
→ Try direct browser fetch first; add a Next.js proxy route only if CORS blocks it.

**Q2: Date and time pickers?**  
→ `react-day-picker` for the calendar popup + custom time `<select>` (30-min increments).

**Q3: Form state and validation?**  
→ `react-hook-form` with `Controller` wrappers.

**Q4: How closely follow the reference screenshot layout?**  
→ Match the hero + search bar pattern (road background photo, white card overlaid).

**Q5: Search button color?**  
→ Blue (`#2563eb`), full-width. Not green.

**Q6: Return time validation rule?**  
→ Must be at least 1 hour after pick-up datetime (combined date + time comparison).

**Q7: Error message display?**  
→ Tooltip floating above the offending field — red background, white text.

**Q8: Mobile/tablet layout?**  
→ From reference screenshot: location full-width, date + time in 2-column pairs, search button full-width below.

**Q9: Component architecture approach?**  
→ Approach B — feature-oriented components (`LocationInput`, `DatePickerInput`, `TimeSelect`, `SearchForm`). No monolith, no over-abstracted hooks.

**Q10: Where to save spec and plan files?**  
→ `doc/` folder only. No commits.
