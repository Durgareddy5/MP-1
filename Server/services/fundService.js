// ============================================
// Fund Service — Balance management
// ============================================
import { sequelize } from '../config/mysql.js';
import { Fund, FundTransaction } from '../Models/sql/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

const MIN_DEPOSIT    = 10000;
const MAX_DEPOSIT    = 100000000; // ₹10 Crore
const MIN_WITHDRAWAL = 10000;

// ─── Get fund balance ──────────────────────
const getFundBalance = async (userId) => {
  const fund = await Fund.findOne({ where: { user_id: userId } });
  if (!fund) throw new Error('Fund account not found');
  return fund;
};

// ─── Deposit virtual funds ─────────────────
const depositFunds = async (userId, amount, description = null) => {
  if (amount < MIN_DEPOSIT) {
    throw new Error(`Minimum deposit is ₹${MIN_DEPOSIT.toLocaleString('en-IN')}`);
  }
  if (amount > MAX_DEPOSIT) {
    throw new Error(`Maximum deposit is ₹${MAX_DEPOSIT.toLocaleString('en-IN')}`);
  }

  const t    = await sequelize.transaction();
  try {
    const fund = await Fund.findOne({ where: { user_id: userId }, transaction: t });
    if (!fund) throw new Error('Fund account not found');

    const newBalance = +(+fund.available_balance + amount).toFixed(2);

    await fund.update({
      available_balance: newBalance,
      total_balance:     +(+fund.total_balance + amount).toFixed(2),
    }, { transaction: t });

    const tx = await FundTransaction.create({
      user_id:          userId,
      transaction_type: 'deposit',
      amount,
      credit_debit:     'credit',
      balance_after:    newBalance,
      description:      description || 'Virtual funds deposited to paper trading account',
      reference_type:   'manual',
      status:           'completed',
    }, { transaction: t });

    await t.commit();
    return { fund: await Fund.findOne({ where: { user_id: userId } }), transaction: tx };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─── Withdraw virtual funds ────────────────
const withdrawFunds = async (userId, amount, description = null) => {
  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')}`);
  }

  const t = await sequelize.transaction();
  try {
    const fund = await Fund.findOne({ where: { user_id: userId }, transaction: t });
    if (!fund) throw new Error('Fund account not found');

    if (+fund.available_balance < amount) {
      throw new Error(
        `Insufficient available balance. Available: ₹${fund.available_balance}`
      );
    }

    const newBalance = +(+fund.available_balance - amount).toFixed(2);

    await fund.update({
      available_balance: newBalance,
      total_balance:     +(+fund.total_balance - amount).toFixed(2),
    }, { transaction: t });

    const tx = await FundTransaction.create({
      user_id:          userId,
      transaction_type: 'withdrawal',
      amount,
      credit_debit:     'debit',
      balance_after:    newBalance,
      description:      description || 'Virtual funds withdrawn from paper trading account',
      reference_type:   'manual',
      status:           'completed',
    }, { transaction: t });

    await t.commit();
    return { fund: await Fund.findOne({ where: { user_id: userId } }), transaction: tx };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─── Fund transaction history ──────────────
const getTransactionHistory = async (userId, filters = {}) => {
  const where  = { user_id: userId };
  const page   = parseInt(filters.page,  10) || 1;
  const limit  = Math.min(parseInt(filters.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  if (filters.type)       where.transaction_type = filters.type;
  if (filters.direction)  where.credit_debit      = filters.direction;

  if (filters.from_date || filters.to_date) {
    where.created_at = {};
    if (filters.from_date) where.created_at[Op.gte] = new Date(filters.from_date);
    if (filters.to_date)   where.created_at[Op.lte] = new Date(filters.to_date);
  }

  const { count, rows } = await FundTransaction.findAndCountAll({
    where,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    transactions: rows,
    pagination: {
      total:       count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    },
  };
};

export { getFundBalance, depositFunds, withdrawFunds, getTransactionHistory };

export default {
  getFundBalance,
  depositFunds,
  withdrawFunds,
  getTransactionHistory,
};