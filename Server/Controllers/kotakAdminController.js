import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

import authService from '../services/kotakAuthService.js';
import marketService from '../services/marketService.js';
import instrumentService from '../services/kotakInstrumentService.js';

export const getSessionStatus = async (req, res) => {
  try {
    const session = authService.getSession();

    return ApiResponse.success(res, {
      data: {
        ready: authService.isSessionReady(),
        session: session
          ? {
              baseUrl: session.baseUrl,
              dataCenter: session.dataCenter,
              greetingName: session.greetingName,
              ucc: session.ucc,
              createdAt: session.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error('GetSessionStatus error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const loginWithTotp = async (req, res) => {
  try {
    const { totp, refreshInstrumentMaster = true } = req.body || {};

    const session = await authService.createSession({ totp });

    let instruments = null;
    if (refreshInstrumentMaster) {
      const result = await marketService.refreshInstrumentMaster();
      instruments = result;
    }

    return ApiResponse.success(res, {
      message: 'Kotak session created successfully',
      data: {
        ready: true,
        session: {
          baseUrl: session.baseUrl,
          dataCenter: session.dataCenter,
          greetingName: session.greetingName,
          ucc: session.ucc,
          createdAt: session.createdAt,
        },
        instruments,
      },
    });
  } catch (error) {
    logger.error('LoginWithTotp error:', { error: error.message });
    return ApiResponse.error(res, {
      message: error.message || 'Kotak login failed',
      statusCode: 400,
      code: 'KOTAK_LOGIN_FAILED',
    });
  }
};

export const autoLogin = async (req, res) => {
  try {
    const session = await authService.createSession({});
    const instruments = await marketService.refreshInstrumentMaster();

    return ApiResponse.success(res, {
      message: 'Kotak session created using configured TOTP secret',
      data: {
        ready: true,
        session: {
          baseUrl: session.baseUrl,
          dataCenter: session.dataCenter,
          greetingName: session.greetingName,
          ucc: session.ucc,
          createdAt: session.createdAt,
        },
        instruments,
      },
    });
  } catch (error) {
    logger.error('AutoLogin error:', { error: error.message });
    return ApiResponse.error(res, {
      message: error.message || 'Automatic Kotak login failed',
      statusCode: 400,
      code: 'KOTAK_AUTO_LOGIN_FAILED',
    });
  }
};

export const refreshInstrumentMaster = async (req, res) => {
  try {
    const result = await marketService.refreshInstrumentMaster();

    return ApiResponse.success(res, {
      message: 'Instrument master refreshed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('RefreshInstrumentMaster error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getInstrumentMasterStatus = async (req, res) => {
  try {
    const count = await instrumentService.getInstrumentCount();

    return ApiResponse.success(res, {
      data: {
        count,
        status: count > 0 ? 'ready' : 'empty',
      },
    });
  } catch (error) {
    logger.error('GetInstrumentMasterStatus error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const logoutKotak = async (req, res) => {
  try {
    authService.clearSession();

    return ApiResponse.success(res, {
      message: 'Kotak session cleared',
      data: { ready: false },
    });
  } catch (error) {
    logger.error('LogoutKotak error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export default {
  getSessionStatus,
  loginWithTotp,
  autoLogin,
  refreshInstrumentMaster,
  getInstrumentMasterStatus,
  logoutKotak,
};
