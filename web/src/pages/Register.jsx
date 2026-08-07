import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  User, Mail, Lock, Building2, Phone, Briefcase,
  CreditCard, ChevronRight, ChevronLeft, Zap,
  ArrowRight, Loader2, CheckCircle2,
} from 'lucide-react';
import useAuthStore  from '@/store/authStore';
import authService   from '@/services/authService';
import toast         from 'react-hot-toast';
import '@/pages/Register.css';
import TrAIdeUrl from "@/assets/TrAIde_1.png";

/* ─── Step indicator ─────────────────────────── */
const StepDot = ({ step, current, label }) => (
  <div className="flex flex-col items-center gap-1">
    <motion.div
      animate={{
        backgroundColor: step <= current
          ? 'var(--accent-primary)'
          : 'var(--bg-tertiary)',
        scale: step === current ? 1.15 : 1,
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center
                 border-2 text-xs font-bold transition-colors duration-300"
      style={{
        borderColor: step <= current
          ? 'var(--accent-primary)'
          : 'var(--border-primary)',
        color: step <= current ? '#fff' : 'var(--text-tertiary)',
      }}
    >
      {step < current ? <CheckCircle2 size={16} /> : step}
    </motion.div>
    <span className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap
                     hidden sm:block">
      {label}
    </span>
  </div>
);

const STEPS = ['Personal', 'Organization', 'Security'];

const Register = () => {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  const nextStep = async () => {
    const fields =
      step === 1 ? ['first_name', 'last_name', 'email'] :
      step === 2 ? [] :
      [];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.success) {
        setAuth(res.data.user, res.data.access_token);
        toast.success('Welcome to ProTrade! Your ₹1 Crore account is ready.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  /* shared input class */
  const inp = (hasErr) =>
    `w-full px-4 py-3 rounded-xl text-sm
     bg-[var(--bg-input)] border
     ${hasErr ? 'border-[var(--loss)]' : 'border-[var(--border-primary)]'}
     text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
     focus:outline-none focus:border-[var(--accent-primary)]
     focus:ring-2 focus:ring-[var(--accent-primary)]/20
     transition-all duration-200`;

  const icnWrap =
    'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]';

  return (
    <div data-theme="dark"
         className="min-h-screen flex items-center justify-center
                    bg-[var(--bg-primary)] px-4 py-12 overflow-hidden">

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                      bg-gradient-to-b from-[#0052FF]/10 to-transparent
                      pointer-events-none blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center" style={{marginBottom: '0.25rem'}}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br
                          from-[#0052FF] to-[#7C3AED] flex items-center
                          justify-center shadow-[0_0_25px_rgba(0,82,255,0.35)]">
            <img 
              src={TrAIdeUrl} 
              alt="TrAIde"
            />
          </div>
          <span className="text-2xl font-heading font-bold
                           bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                           bg-clip-text text-transparent">
            TrAIde
          </span>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                        rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden rounding">

          {/* Progress bar */}
          <div className="h-1 bg-[var(--bg-tertiary)]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#0052FF] to-[#7C3AED]"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          <div className="p-7">
            {/* Steps */}
            <div className="flex items-center justify-between mb-8 relative">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <StepDot step={i + 1} current={step} label={label} />
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2 bg-[var(--border-primary)]" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">

                {/* ── Step 1: Personal Info ── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-xl font-heading font-bold
                                     text-[var(--text-primary)] mb-1">
                        Personal Details
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Tell us about yourself
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium
                                          text-[var(--text-secondary)] mb-1 block">
                          First Name *
                        </label>
                        <div className="relative">
                          <User size={16} className={icnWrap} />
                          <input
                            {...register('first_name', {
                              required: 'Required',
                              minLength: { value: 2, message: 'Min 2 chars' },
                            })}
                            placeholder="Arjun"
                            className={`pl-9 ${inp(errors.first_name)}`} style={{ paddingLeft: '36px' }}
                          />
                        </div>
                        {errors.first_name && (
                          <p className="text-xs text-[var(--loss)] mt-1">
                            {errors.first_name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium
                                          text-[var(--text-secondary)] mb-1 block">
                          Last Name *
                        </label>
                        <div className="relative">
                          <User size={16} className={icnWrap} />
                          <input
                            {...register('last_name', {
                              required: 'Required',
                              minLength: { value: 2, message: 'Min 2 chars' },
                            })}
                            placeholder="Sharma"
                            className={`pl-9 ${inp(errors.last_name)}`} style={{ paddingLeft: '36px' }}
                          />
                        </div>
                        {errors.last_name && (
                          <p className="text-xs text-[var(--loss)] mt-1">
                            {errors.last_name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail size={16} className={icnWrap} />
                        <input
                          type="email"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Enter a valid email',
                            },
                          })}
                          placeholder="arjun@tcs.com"
                          className={`pl-9 ${inp(errors.email)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-[var(--loss)] mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={16} className={icnWrap} />
                        <input
                          type="tel"
                          {...register('phone')}
                          placeholder="98765 43210"
                          className={`pl-9 ${inp(false)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Organization ── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-xl font-heading font-bold
                                     text-[var(--text-primary)] mb-1">
                        Organization Details
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Your company information
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Organization Name
                      </label>
                      <div className="relative">
                        <Building2 size={16} className={icnWrap} />
                        <input
                          {...register('organization_name')}
                          placeholder="Tata Consultancy Services Ltd"
                          className={`pl-9 ${inp(false)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Organization Type
                      </label>
                      <select
                        {...register('organization_type')}
                        className={inp(false)}
                      >
                        <option value="">Select type...</option>
                        <option value="public_limited">Public Limited (PLC)</option>
                        <option value="private_limited">Private Limited (Pvt Ltd)</option>
                        <option value="llp">LLP</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Your Designation
                      </label>
                      <div className="relative">
                        <Briefcase size={16} className={icnWrap} />
                        <input
                          {...register('designation')}
                          placeholder="Chief Investment Officer"
                          className={`pl-9 ${inp(false)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        PAN Number
                      </label>
                      <div className="relative">
                        <CreditCard size={16} className={icnWrap} />
                        <input
                          {...register('pan_number', {
                            pattern: {
                              value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                              message: 'Format: ABCDE1234F',
                            },
                          })}
                          placeholder="ABCDE1234F"
                          className={`pl-9 uppercase ${inp(errors.pan_number)}`}
                          style={{ textTransform: 'uppercase' , paddingLeft: '36px' }}
                        />
                      </div>
                      {errors.pan_number && (
                        <p className="text-xs text-[var(--loss)] mt-1">
                          {errors.pan_number.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Security ── */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-xl font-heading font-bold
                                     text-[var(--text-primary)] mb-1">
                        Set Your Password
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Choose a strong password to secure your account
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock size={16} className={icnWrap} />
                        <input
                          type="password"
                          {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Min 8 chars' },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                              message: 'Include uppercase, number & special char',
                            },
                          })}
                          placeholder="••••••••"
                          className={`pl-9 ${inp(errors.password)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-[var(--loss)] mt-1">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium
                                        text-[var(--text-secondary)] mb-1 block">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock size={16} className={icnWrap} />
                        <input
                          type="password"
                          {...register('confirm_password', {
                            required: 'Please confirm password',
                            validate: (v) =>
                              v === watch('password') || 'Passwords do not match',
                          })}
                          placeholder="••••••••"
                          className={`pl-9 ${inp(errors.confirm_password)}`} style={{ paddingLeft: '36px' }}
                        />
                      </div>
                      {errors.confirm_password && (
                        <p className="text-xs text-[var(--loss)] mt-1">
                          {errors.confirm_password.message}
                        </p>
                      )}
                    </div>

                    {/* Account perks */}
                    <div className="p-4 rounded-xl bg-[var(--profit-bg)]
                                    border border-[var(--profit-border)]">
                      <p className="text-xs font-semibold text-[var(--profit)] mb-2">
                        🎉 What you get on signup:
                      </p>
                      {[
                        '₹1,00,00,000 virtual paper trading funds',
                        'Live NSE & BSE market data access',
                        'All 19 Indian market indices tracking',
                        'Realistic brokerage charge simulation',
                      ].map((item) => (
                        <div key={item}
                             className="flex items-center gap-2 text-xs
                                        text-[var(--text-secondary)] mb-1">
                          <CheckCircle2 size={12}
                            className="text-[var(--profit)] flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Navigation Buttons ── */}
              <div className="flex items-center justify-between mt-8 gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                               text-sm font-medium text-[var(--text-secondary)]
                               bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                               hover:text-[var(--text-primary)]
                               hover:border-[var(--border-secondary)]
                               transition-all duration-200"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <Link to="/login"
                    className="text-sm text-[var(--text-tertiary)]
                               hover:text-[var(--text-primary)] transition-colors">
                    Already a member? Sign in
                  </Link>
                )}

                {step < 3 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                               text-sm font-semibold text-white
                               bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                               shadow-[0_0_20px_rgba(0,82,255,0.25)]
                               hover:shadow-[0_0_30px_rgba(0,82,255,0.4)]
                               transition-all duration-300 rounding"
                  >
                    Continue <ChevronRight size={16} />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                               text-sm font-semibold text-white
                               bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                               disabled:opacity-60 disabled:cursor-not-allowed
                               shadow-[0_0_20px_rgba(0,82,255,0.25)]
                               transition-all duration-300"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                      : <><span>Create Account</span><ArrowRight size={16} /></>
                    }
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;