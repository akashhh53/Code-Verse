import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { ArrowRight, Code2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { loginUser } from "../authSlice";

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-base-300/40 p-8 lg:flex lg:flex-col lg:justify-between">
          <NavLink to="/login" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-content">
              <Code2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xl font-bold">CodeVerse</p>
              <p className="text-sm text-base-content/60">Coding practice made focused</p>
            </div>
          </NavLink>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Secure learner workspace
            </div>
            <div>
              <h1 className="max-w-md text-4xl font-bold leading-tight">
                Continue your problem-solving streak.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-base-content/70">
                Jump back into challenges, track solved problems, and keep your coding rhythm clean.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <AuthMetric value="3" label="Languages" />
              <AuthMetric value="4" label="Topics" />
              <AuthMetric value="AI" label="Hints" />
            </div>
          </div>

          <p className="text-sm text-base-content/50">
            Built for fast practice sessions and focused learning.
          </p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-content">
                  <Code2 className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xl font-bold">CodeVerse</p>
                  <p className="text-sm text-base-content/60">Practice with purpose</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold">Welcome back</h2>
              <p className="mt-2 text-sm text-base-content/60">
                Log in to open your coding dashboard.
              </p>
            </div>

            {error && (
              <div className="alert alert-error mb-5 rounded-lg">
                <span>{getAuthErrorMessage(error)}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <label className={`input input-bordered flex items-center gap-2 ${errors.emailId ? 'input-error' : ''}`}>
                  <Mail className="h-4 w-4 text-base-content/45" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="grow"
                    {...register('emailId')}
                  />
                </label>
                {errors.emailId && (
                  <span className="mt-1 text-sm text-error">{errors.emailId.message}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <label className={`input input-bordered flex items-center gap-2 ${errors.password ? 'input-error' : ''}`}>
                  <LockKeyhole className="h-4 w-4 text-base-content/45" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="grow"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </label>
                {errors.password && (
                  <span className="mt-1 text-sm text-error">{errors.password.message}</span>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Logging in
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-base-content/70">
              New to CodeVerse?{' '}
              <NavLink to="/signup" className="link link-primary font-medium">
                Create an account
              </NavLink>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthMetric({ value, label }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-base-content/55">{label}</p>
    </div>
  );
}

const getAuthErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

export default Login;
