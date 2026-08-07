import env from '../config/environment.js';
import {
  getLoginHeaders,
  postJson,
} from './kotakHttpClient.js';
import { hasTotpSecret, generateTotp } from './kotakTotpService.js';

const LOGIN_PATH = '/login/1.0/tradeApiLogin';
const VALIDATE_PATH = '/login/1.0/tradeApiValidate';

let currentSession = null;

const normalizeLoginData = (data = {}) => ({
  token: data.token || '',
  sid: data.sid || '',
  rid: data.rid || '',
  baseUrl: data.baseUrl || '',
  dataCenter: data.dataCenter || '',
  kType: data.kType || '',
  status: data.status || '',
  greetingName: data.greetingName || '',
  ucc: data.ucc || env.KOTAK_UCC,
});

const loginWithTotp = async (totp) => {
  if (!totp) {
    throw new Error('TOTP is required for Kotak login');
  }

  const payload = {
    mobileNumber: env.KOTAK_MOBILE_NUMBER,
    ucc: env.KOTAK_UCC,
    totp,
  };

  const response = await postJson({
    baseURL: env.KOTAK_LOGIN_BASE_URL,
    url: LOGIN_PATH,
    data: payload,
    headers: getLoginHeaders(),
  });

  const data = normalizeLoginData(response?.data);

  if (!data.token || !data.sid) {
    throw new Error(response?.message || 'Kotak TOTP login failed');
  }

  return data;
};

const validateMpin = async ({ viewToken, viewSid, mpin = env.KOTAK_MPIN }) => {
  if (!viewToken || !viewSid) {
    throw new Error('View token and view sid are required');
  }

  const response = await postJson({
    baseURL: env.KOTAK_LOGIN_BASE_URL,
    url: VALIDATE_PATH,
    data: { mpin },
    headers: {
      ...getLoginHeaders(),
      Auth: viewToken,
      sid: viewSid,
    },
  });

  const data = normalizeLoginData(response?.data);

  if (!data.token || !data.sid) {
    throw new Error(response?.message || 'Kotak MPIN validation failed');
  }

  return data;
};

const createSession = async ({ totp } = {}) => {
  const resolvedTotp = totp || (hasTotpSecret() ? await generateTotp() : '');


  if (!resolvedTotp) {
    throw new Error(
      'No TOTP available. Provide a TOTP manually or configure KOTAK_TOTP_SECRET.'
    );
  }

  const viewLogin = await loginWithTotp(resolvedTotp);
  const tradeLogin = await validateMpin({
    viewToken: viewLogin.token,
    viewSid: viewLogin.sid,
  });

  currentSession = {
  accessToken: env.KOTAK_ACCESS_TOKEN,
  viewToken: viewLogin.token,
  viewSid: viewLogin.sid,

  tradeToken: tradeLogin.token,
  tradeSid: tradeLogin.sid,

  // 🔥 ADD THESE INSIDE SESSION (NOT JUST RETURN)
  authToken: tradeLogin.token,
  sid: tradeLogin.sid,

  rid: tradeLogin.rid,
  baseUrl: tradeLogin.baseUrl || env.KOTAK_DEFAULT_BASE_URL,
  dataCenter: tradeLogin.dataCenter || '',
  greetingName: tradeLogin.greetingName,
  ucc: tradeLogin.ucc,
  createdAt: new Date().toISOString(),
};

console.log('🔥 TRADE TOKEN:', currentSession.tradeToken);
console.log('🔥 TRADE SID:', currentSession.tradeSid);

return currentSession;
};


const getSession = () => currentSession;

const requireSession = () => {
  if (!currentSession?.tradeToken || !currentSession?.tradeSid || !currentSession?.baseUrl) {
    throw new Error('Kotak session is not ready. Login first.');
  }

  return currentSession;
};

const isSessionReady = () =>
  Boolean(
    currentSession?.tradeToken &&
    currentSession?.tradeSid &&
    currentSession?.baseUrl
  );

const clearSession = () => {
  currentSession = null;
};

const getTradeAuth = () => {
  const session = requireSession();

  return {
    tradeToken: session.tradeToken,
    tradeSid: session.tradeSid,
    baseUrl: session.baseUrl,
    dataCenter: session.dataCenter,
  };
};

export {
  loginWithTotp,
  validateMpin,
  createSession,
  getSession,
  requireSession,
  isSessionReady,
  clearSession,
  getTradeAuth,
};

export default {
  loginWithTotp,
  validateMpin,
  createSession,
  getSession,
  requireSession,
  isSessionReady,
  clearSession,
  getTradeAuth,
};
