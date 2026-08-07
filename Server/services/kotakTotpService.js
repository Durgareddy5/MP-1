import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import env from '../config/environment.js';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  period: 30,
  digits: 6,
  algorithm: 'sha1',
});

const hasTotpSecret = () => Boolean(env.KOTAK_TOTP_SECRET);

const generateTotp = async () => {
  if (!env.KOTAK_TOTP_SECRET) {
    throw new Error('KOTAK_TOTP_SECRET is not configured');
  }

  return totp.generate({
    secret: env.KOTAK_TOTP_SECRET,
    epoch: Math.floor(Date.now() / 1000),
  });
};

export { hasTotpSecret, generateTotp };

export default {
  hasTotpSecret,
  generateTotp,
};
