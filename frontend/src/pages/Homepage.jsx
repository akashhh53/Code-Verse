import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Filter,
  LogOut,
  Search,
  Shield,
  Trophy,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

const difficultyOptions = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const tagOptions = [
  { value: 'all', label: 'All Tags' },
  { value: 'array', label: 'Array' },
  { value: 'linkedList', label: 'Linked List' },
  { value: 'graph', label: 'Graph' },
  { value: 'dp', label: 'Dynamic Programming' },
];

const statusOptions = [
  { value: 'all', label: 'All Problems' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
];

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [{ data: problemData }, { data: solvedData }] = await Promise.all([
          axiosClient.get('/problem/getAllProblem'),
          user ? axiosClient.get('/problem/problemSolvedByUser') : Promise.resolve({ data: [] }),
        ]);

        if (!isMounted) return;

        setProblems(Array.isArray(problemData) ? problemData : []);
        setSolvedProblems(Array.isArray(solvedData) ? solvedData : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        if (!isMounted) return;

        if (error.response?.status === 404) {
          setProblems([]);
          setSolvedProblems([]);
          return;
        }

        setError('Unable to load problems right now. Please refresh and try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const solvedProblemIds = new Set(solvedProblems.map((problem) => problem._id));
  const totalProblems = problems.length;
  const solvedCount = problems.filter((problem) => solvedProblemIds.has(problem._id)).length;
  const pendingCount = Math.max(totalProblems - solvedCount, 0);
  const completionRate = totalProblems ? Math.round((solvedCount / totalProblems) * 100) : 0;
  const activeFilters = [
    filters.status !== 'all',
    filters.difficulty !== 'all',
    filters.tag !== 'all',
    Boolean(searchTerm.trim()),
  ].filter(Boolean).length;

  const filteredProblems = problems.filter((problem) => {
    const isSolved = solvedProblemIds.has(problem._id);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const titleMatch = problem.title?.toLowerCase().includes(normalizedSearch);
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch =
      filters.status === 'all' ||
      (filters.status === 'solved' && isSolved) ||
      (filters.status === 'unsolved' && !isSolved);

    return titleMatch && difficultyMatch && tagMatch && statusMatch;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      difficulty: 'all',
      tag: 'all',
      status: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-content">
              <Code2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">CodeVerse</p>
              <p className="text-xs text-base-content/60">Practice with purpose</p>
            </div>
          </NavLink>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="btn btn-ghost btn-sm hidden gap-2 sm:inline-flex">
                <Shield className="h-4 w-4" />
                Admin
              </NavLink>
            )}

            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost gap-2">
                <div className="avatar placeholder">
                  <div className="w-9 rounded-full bg-primary text-primary-content">
                    <span>{getInitials(user?.firstName)}</span>
                  </div>
                </div>
                <span className="hidden sm:inline">{user?.firstName || 'Coder'}</span>
              </button>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-50 mt-3 w-56 rounded-lg border border-base-300 bg-base-100 p-2 shadow-xl"
              >
                {user?.role === 'admin' && (
                  <li>
                    <NavLink to="/admin">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </NavLink>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Trophy className="h-4 w-4" />
                Level up one problem at a time
              </div>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {user?.firstName || 'coder'}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-base-content/70">
                Find the right challenge, track what you have solved, and jump back into practice without friction.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[30rem]">
              <StatCard label="Problems" value={totalProblems} />
              <StatCard label="Solved" value={solvedCount} />
              <StatCard label="Progress" value={`${completionRate}%`} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="input input-bordered flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-base-content/50" />
              <input
                type="search"
                className="grow"
                placeholder="Search problems by title"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[38rem]">
              <select
                className="select select-bordered w-full"
                value={filters.status}
                onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                aria-label="Filter by status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="select select-bordered w-full"
                value={filters.difficulty}
                onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
                aria-label="Filter by difficulty"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="select select-bordered w-full"
                value={filters.tag}
                onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
                aria-label="Filter by topic"
              >
                {tagOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-base-content/60">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {activeFilters ? `${activeFilters} active filter${activeFilters > 1 ? 's' : ''}` : 'Showing all problems'}
            </span>
            {activeFilters > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Problem Set</h2>
              <p className="text-sm text-base-content/60">
                {pendingCount} unsolved, {solvedCount} solved
              </p>
            </div>
            <span className="badge badge-outline">
              {filteredProblems.length} of {totalProblems} showing
            </span>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="skeleton h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="skeleton h-4 w-2/5" />
                      <div className="skeleton h-3 w-3/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="alert alert-error rounded-lg">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && filteredProblems.length === 0 && (
            <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-base-content/40" />
              <h3 className="mt-4 text-lg font-semibold">No problems found</h3>
              <p className="mt-2 text-sm text-base-content/60">
                Try changing the search text or clearing your filters.
              </p>
              {activeFilters > 0 && (
                <button type="button" className="btn btn-primary btn-sm mt-5" onClick={resetFilters}>
                  Show all problems
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && filteredProblems.length > 0 && (
            <div className="space-y-3">
              {filteredProblems.map((problem) => {
                const isSolved = solvedProblemIds.has(problem._id);

                return (
                  <NavLink
                    key={problem._id}
                    to={`/problem/${problem._id}`}
                    className="group block rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSolved ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                          {isSolved ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                        </span>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold transition group-hover:text-primary">
                            {problem.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                              {formatDifficulty(problem.difficulty)}
                            </span>
                            <span className="badge badge-info badge-outline">
                              {getTagLabel(problem.tags)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-3 sm:border-0 sm:pt-0">
                        <span className={`badge ${isSolved ? 'badge-success' : 'badge-ghost'}`}>
                          {isSolved ? 'Solved' : 'Unsolved'}
                        </span>
                        <span className="btn btn-primary btn-outline btn-sm">Open</span>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

const getInitials = (name) => {
  if (!name) return 'C';
  return name.trim().charAt(0).toUpperCase() || 'C';
};

const getTagLabel = (tag) => {
  return tagOptions.find((option) => option.value === tag)?.label || tag;
};

const formatDifficulty = (difficulty = '') => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const getDifficultyBadgeColor = (difficulty = '') => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'badge-success';
    case 'medium':
      return 'badge-warning';
    case 'hard':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
};

export default Homepage;
