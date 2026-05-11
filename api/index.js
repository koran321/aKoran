import app from "../src/app.js";

const PORT = process.env.PORT || 3000;

// This listener is for local development
// Vercel handles the listener in production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
