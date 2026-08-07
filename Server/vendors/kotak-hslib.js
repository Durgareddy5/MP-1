import axios from "axios";
import { authenticator } from "@otplib/preset-default";


// ==========================
// 🔐 SESSION STORAGE
// ==========================
let session = {
  accessToken: null,
  viewToken: null,
  viewSid: null,
  authToken: null,
  sid: null,
  baseUrl: null,
};

// ==========================
// 🔗 CONSTANTS
// ==========================
const LOGIN_URL =
  "https://mis.kotaksecurities.com/login/1.0/tradeApiLogin";

const VALIDATE_URL =
  "https://mis.kotaksecurities.com/login/1.0/tradeApiValidate";

// ==========================
// 🔢 GENERATE TOTP
// ==========================
function generateTOTP(secret) {
  return authenticator.generate(secret);
}

// ==========================
// 🔐 STEP 1: LOGIN (TOTP)
// ==========================
export async function login({ accessToken, mobile, ucc, totpSecret }) {
  try {
    session.accessToken = accessToken;
  
  if (!totpSecret) {
  throw new Error("TOTP Secret is missing");
  }
  const totp = generateTOTP(totpSecret);
  console.log("🔐 Generated TOTP:", totp);

    const res = await axios.post(
      LOGIN_URL,
      {
        mobileNumber: mobile.startsWith("+91") ? mobile : `+91${mobile}`,
        ucc: ucc,
        totp: totp,
      },
      {
        headers: {
          Authorization: accessToken,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/json",
        },
      }
    );

    const data = res.data?.data;

    session.viewToken = data.token;
    session.viewSid = data.sid;

    console.log("✅ TOTP Login Success");

    console.log("📥 Incoming Body:", {
    accessToken,
    mobile,
    ucc,
    totpSecret,
    });

    return {
      success: true,
      message: "TOTP verified. Proceed to MPIN.",
    };
  } catch (err) {
    console.error(
      "❌ TOTP Login Failed:",
      err.response?.data || err.message
    );
    console.error("FULL ERROR:", err.response?.data);
    throw new Error(JSON.stringify(err.response?.data || err.message));
  }
}

// ==========================
// 🔐 STEP 2: MPIN VALIDATION
// ==========================
export async function validateMPIN(mpin) {
  try {
    const res = await axios.post(
      VALIDATE_URL,
      { mpin },
      {
        headers: {
          Authorization: session.accessToken,
          "neo-fin-key": "neotradeapi",
          sid: session.viewSid,
          Auth: session.viewToken,
          "Content-Type": "application/json",
        },
      }
    );

    const data = res.data?.data;

    session.authToken = data.token;
    session.sid = data.sid;
    session.baseUrl = data.baseUrl;

    console.log("✅ MPIN Validation Success");
    console.log("🌐 Base URL:", session.baseUrl);

    return {
      success: true,
      baseUrl: session.baseUrl,
      authToken: session.authToken,
      sid: session.sid,
    };
  } catch (err) {
    console.error(
      "❌ MPIN Validation Failed:",
      err.response?.data || err.message
    );
    throw err;
  }
}

// ==========================
// 📊 LIVE MARKET DATA
// ==========================
export async function getQuotes(query) {
  try {
    if (!session.baseUrl) {
      throw new Error("Not authenticated. Call validateMPIN first.");
    }

    const url = `${session.baseUrl}/script-details/1.0/quotes/neosymbol/${query}/all`;

    const res = await axios.get(url, {
      headers: {
        Authorization: session.accessToken, // ⚠️ IMPORTANT
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "❌ Quotes Error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

// ==========================
// 📄 ORDER BOOK (READ ONLY)
// ==========================
export async function getOrderBook() {
  try {
    const url = `${session.baseUrl}/quick/user/orders`;

    const res = await axios.get(url, {
      headers: {
        Auth: session.authToken,
        Sid: session.sid,
        "neo-fin-key": "neotradeapi",
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "❌ OrderBook Error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

// ==========================
// 📊 POSITIONS
// ==========================
export async function getPositions() {
  try {
    const url = `${session.baseUrl}/quick/user/positions`;

    const res = await axios.get(url, {
      headers: {
        Auth: session.authToken,
        Sid: session.sid,
        "neo-fin-key": "neotradeapi",
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "❌ Positions Error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

// ==========================
// 🛑 BLOCK REAL TRADING
// ==========================
export async function placeOrder() {
  throw new Error(
    "🚫 Real trading disabled. Use paper trading instead."
  );
}

// ==========================
// 🧪 DEBUG SESSION
// ==========================
export function getSession() {
  return session;
}