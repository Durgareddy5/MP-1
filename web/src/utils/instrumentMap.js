// 🔥 CENTRAL SOURCE OF TRUTH

export const SYMBOL_TO_TOKEN = {
  RELIANCE: "nse_cm|500325",
  TCS: "nse_cm|532540",
  HDFCBANK: "nse_cm|500180",
  INFY: "nse_cm|500209",
  WIPRO: "nse_cm|507685",

  // Indices
  NIFTY: "nse_cm|26000",
  BANKNIFTY: "nse_cm|26009",
};

export const TOKEN_TO_SYMBOL = Object.fromEntries(
  Object.entries(SYMBOL_TO_TOKEN).map(([k, v]) => [v.split("|")[1], k])
);