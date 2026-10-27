import type { Project } from "../schema";

// Source: resume PDF + the public repositories (read 2026-10-26).
// To add a project: append an entry here, put images in public/projects/<slug>/,
// and make sure every `tech` id exists in skills.ts (npm test checks this).
export const projects: Project[] = [
  {
    slug: "weather-information-system",
    title: "Weather Information System",
    summary: "A Django web app that shows real-time weather and forecasts using the OpenWeatherMap API.",
    description: [
      "Built with Python and Django, the app requests current conditions and forecast data from the OpenWeatherMap API and renders them in server-side templates.",
      "It includes dedicated pages for Mumbai, Delhi, Bangalore and Kolkata, a forecast view, login and registration pages, and a Django model that stores each city's temperature, humidity and conditions in SQLite.",
    ],
    kind: "web",
    context: "personal",
    role: "Developer",
    contribution: ["Built the Django backend, API integration and HTML/CSS templates."],
    features: [
      "Real-time weather and forecast via OpenWeatherMap",
      "City pages for Mumbai, Delhi, Bangalore and Kolkata",
      "Login and registration pages",
      "City weather model stored in SQLite",
    ],
    start: "2024-01",
    tech: ["python", "django", "sqlite", "html", "css"],
    links: { repo: "https://github.com/jathinellanti/Weatherapp" },
    // Real screenshots: the repo's own templates and static files rendered for a
    // plain GET request (no API call, so no weather readings are shown).
    images: [
      {
        src: "/projects/weather-information-system/home-1440.webp",
        alt: "Weather Forecaster home page: the title “Welcome to Weather Forecaster” and a Get Forecast button over a full-screen cloud video",
        width: 1440,
        height: 900,
        caption: "Home page with a full-screen cloud video background",
      },
      {
        src: "/projects/weather-information-system/forecast-1440.webp",
        alt: "Weather Forecast page: a location search box above quick-link cards for Mumbai, Delhi, Bangalore and Kolkata, with empty current-weather and 5-day forecast panels",
        width: 1440,
        height: 900,
        caption: "Forecast page: search any city, or jump to one of four",
      },
    ],
  },
  {
    slug: "employee-leave-management",
    title: "Employee Leave Management System",
    summary: "A MERN-stack web app for managing employee leave, with separate Admin, HR and Employee dashboards.",
    description: [
      "An academic team project built on MongoDB, Express, React and Node.js. The Express server exposes separate routes and controllers for login, admin, HR and employee operations, with Mongoose models for each role.",
      "The React front end (Material UI and Bootstrap) gives each role its own dashboard: admins add, view and delete employees; HR staff manage leave requests and review leave history; employees apply for leave and track their balances and leaves taken.",
    ],
    kind: "web",
    context: "academic-team",
    role: "Team member",
    contribution: [],
    features: [
      "Role-based dashboards for Admin, HR and Employee",
      "Apply for leave, view balances and leave history",
      "Admin employee management (add, view, delete)",
      "Express REST API with Mongoose models",
    ],
    start: "2024-04",
    tech: ["react", "javascript", "nodejs", "express", "mongoose", "mongodb", "material-ui", "bootstrap"],
    links: { repo: "https://github.com/jathinellanti/ELMS-sdp-s12-team-13" },
    images: [],
  },
];
