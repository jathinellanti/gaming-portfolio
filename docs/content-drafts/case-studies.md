# Case-study drafts (NOT PUBLISHED)

These drafts were written by reading the public repository code on 2026-10-26. **They are unverified.** Nothing here appears on the site until you confirm or rewrite it.

To publish one:
1. Copy it into `src/content/data/caseStudies.ts`.
2. Set `verified: true`.
3. Run `npm test`.

Each draft follows the boss-encounter structure: Encounter → Challenge → Strategy → Arsenal → Outcome → Evidence.

---

## Draft 1: "One server, three roles" (Employee Leave Management System)

```ts
{
  id: "elms-three-roles",
  title: "One server, three roles",
  projectSlug: "employee-leave-management",
  verified: false, // ← owner: confirm before publishing
  encounter: "One Express API had to serve three different dashboards (Admin, HR and Employee) from a single MongoDB database.",
  challenge: "Each role needs different operations (managing employees, reviewing leave, applying for leave) without one role's endpoints leaking into another's.",
  strategy: [
    "Split the server into one Express router and controller per role (admin, HR, employee, login).",
    "Model each entity with Mongoose schemas.",
    "Validate required fields on write endpoints (e.g. /applyleave, /addemployee) and return 400 with a clear error when any are missing.",
  ],
  arsenal: ["nodejs", "express", "mongoose", "mongodb", "react"],
  outcome: "OWNER: describe what you personally built and what worked.",
  evidence: [{ label: "Source on GitHub", href: "https://github.com/jathinellanti/ELMS-sdp-s12-team-13" }],
}
```

**Questions for you:**
- Which parts did you build? The site currently says only "Team project".
- Found while reading the code: the mounted admin login (`server/routes/loginroutes.js`) compares plaintext passwords (`password === user.password`). A bcrypt-based controller exists in `server/controllers/logincontroller.js` but isn't wired in. Fixing that would make a good "phase 2" for this encounter, and a strong, honest case study.
- `server/.env` is committed publicly. Rotate the MongoDB credentials and remove the file.

---

## Draft 2: "Four cities, one forecast" (Weather Information System)

```ts
{
  id: "weather-four-cities",
  title: "Four cities, one forecast",
  projectSlug: "weather-information-system",
  verified: false, // ← owner: confirm before publishing
  encounter: "Show live weather and a forecast for several Indian cities from a third-party API.",
  challenge: "Each page needs two OpenWeatherMap calls (current conditions and forecast) whose JSON must be reshaped into template-friendly data.",
  strategy: [
    "Call the current-weather and forecast endpoints with the requests library.",
    "Map the JSON into template context for server-rendered Django pages.",
    "Store city readings (temperature, humidity, conditions) in a Django model backed by SQLite.",
  ],
  arsenal: ["python", "django", "sqlite", "html", "css"],
  outcome: "OWNER: describe the result and what you learned.",
  evidence: [{ label: "Source on GitHub", href: "https://github.com/jathinellanti/Weatherapp" }],
}
```

**Questions for you:**
- Found while reading the code: the five city views (`home`/`forecast`, `mumbai`, `delhi`, `bangalore`, `kolkata`) repeat the same logic. Folding them into one parameterised view would make a good "phase 2".
- The OpenWeatherMap API key is hardcoded in `API/WAPI/views.py` in a public repo. Regenerate it in your OpenWeatherMap account and load it from an environment variable.
