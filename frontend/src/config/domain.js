// Domain Configuration
const FRONTEND_DOMAIN =
  process.env.NODE_ENV === "production" ? "https://events.kambaa.ai" : "http://localhost:3000";

export default FRONTEND_DOMAIN;
