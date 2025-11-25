
// --- API CONFIGURATION ---
// Manage your environment variables and keys here for deployment.

export const API_CONFIG = {
  // Google Gemini API (AI Features)
  // The app will try process.env.API_KEY first, then fall back to this.
  GEMINI_API_KEY: process.env.API_KEY || "", 

  // Stripe Configuration (Payment Features)
  // PASTE YOUR STRIPE KEYS HERE
  STRIPE_PUBLISHABLE_KEY: "pk_test_YOUR_PUBLISHABLE_KEY", 
  STRIPE_SECRET_KEY: "sk_test_YOUR_SECRET_KEY", 
};
