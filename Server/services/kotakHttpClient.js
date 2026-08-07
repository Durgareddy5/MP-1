import axios from 'axios';
import env from '../config/environment.js';

const DEFAULT_TIMEOUT = 30000;

const createHttpClient = (baseURL = '') =>
  axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      Accept: 'application/json',
    },
  });

const safeData = (response) => response?.data ?? null;

const buildKotakError = (error, fallbackMessage) => {
  const status = error.response?.status || 500;
  const payload = error.response?.data || null;

  return new Error(
    payload?.message ||
    payload?.emsg ||
    fallbackMessage ||
    `Kotak API request failed with status ${status}`
  );
};

const getLoginHeaders = () => ({
  Authorization: env.KOTAK_ACCESS_TOKEN,
  'neo-fin-key': env.KOTAK_NEO_FIN_KEY,
  'Content-Type': 'application/json',
});

const getQuoteHeaders = () => ({
  Authorization: env.KOTAK_ACCESS_TOKEN,
  'Content-Type': 'application/json',
});

const getTradeHeaders = ({ tradeToken, tradeSid, contentType = 'application/json' }) => ({
  Auth: tradeToken,
  Sid: tradeSid,
  'neo-fin-key': env.KOTAK_NEO_FIN_KEY,
  Accept: 'application/json',
  'Content-Type': contentType,
});

const postJson = async ({ baseURL = '', url, data, headers = {} }) => {
  try {
    const client = createHttpClient(baseURL);
    const response = await client.post(url, data, { headers });
    return safeData(response);
  } catch (error) {
    throw buildKotakError(error, 'Kotak JSON POST request failed');
  }
};

const getJson = async ({ baseURL = '', url, headers = {} }) => {
  try {
    const client = createHttpClient(baseURL);
    const response = await client.get(url, { headers });
    return safeData(response);
  } catch (error) {
    throw buildKotakError(error, 'Kotak GET request failed');
  }
};

const postForm = async ({ baseURL = '', url, jData, headers = {} }) => {
  try {
    const client = createHttpClient(baseURL);
    const body = new URLSearchParams();
    body.append('jData', JSON.stringify(jData));

    const response = await client.post(url, body.toString(), {
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return safeData(response);
  } catch (error) {
    throw buildKotakError(error, 'Kotak form POST request failed');
  }
};

export {
  createHttpClient,
  getLoginHeaders,
  getQuoteHeaders,
  getTradeHeaders,
  getJson,
  postJson,
  postForm,
};

export default {
  createHttpClient,
  getLoginHeaders,
  getQuoteHeaders,
  getTradeHeaders,
  getJson,
  postJson,
  postForm,
};
