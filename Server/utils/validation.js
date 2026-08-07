const Joi = require('joi');

const validateEmail = (email) => {
  const schema = Joi.string().email().required();
  const { error, value } = schema.validate(email);
  return { valid: !error, error: error ? error.message : null, value };
};

const validatePassword = (password) => {
  const schema = Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/);
  const { error, value } = schema.validate(password);
  return {
    valid: !error,
    error: error ? 'Password must have uppercase, lowercase, number, and special character' : null,
    value,
  };
};

const validateRegistration = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    phone: Joi.string().regex(/^[0-9]{10}$/),
    mncName: Joi.string().optional(),
  });
  return schema.validate(data);
};

const validateOrder = (data) => {
  const schema = Joi.object({
    symbol: Joi.string().min(1).max(20).required().uppercase(),
    orderType: Joi.string().valid('BUY', 'SELL').required(),
    priceType: Joi.string().valid('MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT').required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().positive().required(),
    triggerPrice: Joi.number().positive().when('priceType', {
      is: Joi.string().valid('STOP_LOSS', 'STOP_LIMIT'),
      then: Joi.required(),
    }),
    validity: Joi.string().valid('DAY', 'IOC', 'GTD').required(),
    validityDate: Joi.date().when('validity', {
      is: 'GTD',
      then: Joi.required(),
    }),
  });
  return schema.validate(data);
};

const validatePANNumber = (pan) => {
  const schema = Joi.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .required();
  const { error } = schema.validate(pan);
  return !error;
};

const validateAadharNumber = (aadhar) => {
  const schema = Joi.string()
    .regex(/^[0-9]{12}$/)
    .required();
  const { error } = schema.validate(aadhar);
  return !error;
};

export {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateOrder,
  validatePANNumber,
  validateAadharNumber,
};
