import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { ArrowRight, Code2, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { registerUser } from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum character should be 3"),
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-content">
                <Code2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xl font-bold">CodeVerse</p>
                <p className="text-sm text-base-content/60">Start your practice journey</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold">Create your account</h2>
              <p className="mt-2 text-sm text-base-content/60">
                Set up your profile and begin solving curated coding problems.
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
                  <span className="label-text font-medium">First name</span>
                </label>
                <label className={`input input-bordered flex items-center gap-2 ${errors.firstName ? 'input-error' : ''}`}>
                  <UserRound className="h-4 w-4 text-base-content/45" />
                  <input
                    type="text"
                    placeholder="Your name"
                    className="grow"
                    {...register('firstName')}
                  />
                </label>
                {errors.firstName && (
                  <span className="mt-1 text-sm text-error">{errors.firstName.message}</span>
                )}
              </div>

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
                    placeholder="At least 8 characters"
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
                    Creating account
                  </>
                ) : (
                  <>
                    Sign up
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-base-content/70">
              Already have an account?{' '}
              <NavLink to="/login" className="link link-primary font-medium">
                Login
              </NavLink>
            </p>
          </div>
        </section>

        <section className="hidden bg-base-300/40 p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Built for consistent growth
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Practice problems, learn patterns, build confidence.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-base-content/70">
              CodeVerse helps you move from topic practice to real problem-solving habits.
            </p>
          </div>

          <div className="grid gap-3">
            <FeatureRow title="Track progress" text="See solved problems and pending practice at a glance." />
            <FeatureRow title="Learn with editorials" text="Use explanations and videos when a concept needs a second look." />
            <FeatureRow title="Ask AI" text="Get guidance inside the problem workspace without losing context." />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureRow({ title, text }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-base-content/60">{text}</p>
    </div>
  );
}

const getAuthErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

export default Signup;
