import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Check, ChevronDown, Circle, Search, SlidersHorizontal, Trophy, X } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { AppHeader, EmptyState, PageShell } from '../components/CodeVerseUI';
import {
  difficultyOptions,
  formatLabel,
  getDifficultyDot,
  getDifficultyTone,
  selectDailyChallenge,
  statusOptions,
  tagOptions,
} from '../utils/problemMeta';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [topicFilterOptions, setTopicFilterOptions] = useState(tagOptions);
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
        const [{ data: problemData }, { data: solvedData }, { data: topicData }] = await Promise.all([
          axiosClient.get('/problem/getAllProblem'),
          user ? axiosClient.get('/problem/problemSolvedByUser') : Promise.resolve({ data: [] }),
          axiosClient.get('/problem/topics').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        setProblems(Array.isArray(problemData) ? problemData : []);
        setSolvedProblems(Array.isArray(solvedData) ? solvedData : []);

        const backendTopicOptions = Array.isArray(topicData)
          ? topicData.filter((topic) => topic.value && topic.label)
          : [];

        setTopicFilterOptions(
          backendTopicOptions.length
            ? [{ value: 'all', label: 'All topics' }, ...backendTopicOptions]
            : tagOptions
        );
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

  const solvedProblemIds = useMemo(() => new Set(solvedProblems.map((problem) => problem._id)), [solvedProblems]);
  const totalProblems = problems.length;
  const solvedCount = problems.filter((problem) => solvedProblemIds.has(problem._id)).length;
  const completionRate = totalProblems ? Math.round((solvedCount / totalProblems) * 100) : 0;
  const progressByDifficulty = getProgressByDifficulty(problems, solvedProblemIds);
  const dailyChallenge = selectDailyChallenge(problems, solvedProblemIds, user?._id || user?.emailId || user?.firstName);

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

  const activeFilters = [
    searchTerm.trim() && { key: 'search', label: `Search: ${searchTerm.trim()}` },
    filters.status !== 'all' && { key: 'status', label: `Status: ${getOptionLabel(statusOptions, filters.status)}` },
    filters.difficulty !== 'all' && { key: 'difficulty', label: `Difficulty: ${getOptionLabel(difficultyOptions, filters.difficulty)}` },
    filters.tag !== 'all' && { key: 'tag', label: `Topic: ${getOptionLabel(topicFilterOptions, filters.tag)}` },
  ].filter(Boolean);
  const hasActiveFilters = activeFilters.length > 0;

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ difficulty: 'all', tag: 'all', status: 'all' });
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  return (
    <div className="cv-page">
      <AppHeader user={user} onLogout={handleLogout} active="problems" />

      <PageShell>
        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            {dailyChallenge.problem ? (
              <NavLink to={`/problem/${dailyChallenge.problem._id}`} className="cv-chip mb-5 hover:border-primary hover:text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                {dailyChallenge.label}
              </NavLink>
            ) : (
              <div className="cv-chip mb-5">
                <span className={`h-1.5 w-1.5 rounded-full ${dailyChallenge.state === 'caught-up' ? 'bg-success' : 'bg-base-content/40'}`}></span>
                {dailyChallenge.label}
              </div>
            )}
            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Welcome back, {user?.firstName || 'Coder'}.
              <span className="block text-base-content/52">
                {dailyChallenge.state === 'caught-up' ? "You're caught up today." : "Let's solve something today."}
              </span>
            </h1>
          </div>

          <ProgressCard
            completionRate={completionRate}
            solvedCount={solvedCount}
            totalProblems={totalProblems}
            progressByDifficulty={progressByDifficulty}
          />
        </section>

        <section className="cv-panel-soft mb-4 p-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_10rem_12rem_minmax(12rem,18rem)_auto] xl:items-center">
            <label className="cv-control flex items-center gap-3 px-4">
              <Search className="h-4 w-4 text-base-content/45" />
              <input
                type="search"
                aria-label="Search problems"
                className="w-full bg-transparent outline-none placeholder:text-base-content/45"
                placeholder="Search problems by name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <FilterMenu
              label="Status"
              value={filters.status}
              onChange={(value) => updateFilter('status', value)}
              options={statusOptions}
            />
            <FilterMenu
              label="Difficulty"
              value={filters.difficulty}
              onChange={(value) => updateFilter('difficulty', value)}
              options={difficultyOptions}
            />
            <FilterMenu
              label="Topic"
              value={filters.tag}
              onChange={(value) => updateFilter('tag', value)}
              options={topicFilterOptions}
            />
            <button
              type="button"
              className="btn h-11 rounded-2xl border-base-300 bg-base-100 px-4"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-base-300/70 pt-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-xs font-semibold text-secondary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Showing {filteredProblems.length}/{totalProblems}
            </span>
            {hasActiveFilters ? (
              activeFilters.map((filter) => (
                <span key={filter.key} className="rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs text-base-content/70">
                  {filter.label}
                </span>
              ))
            ) : (
              <span className="text-xs text-base-content/50">No filters applied</span>
            )}
          </div>
        </section>

        {isLoading && <ProblemSkeleton />}

        {!isLoading && error && (
          <div className="alert alert-error rounded-2xl">
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && filteredProblems.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="No problems found"
            text="Adjust the search or filters. Matching problems will appear here."
          />
        )}

        {!isLoading && !error && filteredProblems.length > 0 && (
          <section className="cv-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cv-table min-w-[760px]">
                <thead>
                  <tr>
                    <th className="w-16">#</th>
                    <th>Title</th>
                    <th className="text-right">Topic</th>
                    <th className="text-right">Status</th>
                    <th className="text-right">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem, index) => {
                    const isSolved = solvedProblemIds.has(problem._id);

                    return (
                      <tr key={problem._id}>
                        <td>
                          {isSolved ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-secondary">{index + 1}</span>
                          )}
                        </td>
                        <td>
                          <NavLink to={`/problem/${problem._id}`} className="font-bold text-base-content transition hover:text-primary">
                            {problem.title}
                          </NavLink>
                        </td>
                        <td className="text-right">
                          <span className="rounded-full border border-base-300 px-3 py-1 text-xs text-secondary">
                            {getOptionLabel(topicFilterOptions, problem.tags)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className={`inline-flex items-center gap-2 text-sm ${isSolved ? 'text-success' : 'text-base-content/45'}`}>
                            {isSolved ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                            {isSolved ? 'Solved' : 'Unsolved'}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className={`inline-flex items-center justify-end gap-2 font-semibold ${getDifficultyTone(problem.difficulty)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${getDifficultyDot(problem.difficulty)}`}></span>
                            {formatLabel(problem.difficulty)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </PageShell>
    </div>
  );
}

const getOptionLabel = (options, value) => {
  return options.find((option) => option.value === value)?.label || value;
};

function FilterMenu({ label, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = getOptionLabel(options, value);

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        type="button"
        className="cv-control flex w-full items-center justify-between gap-3 px-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={label}
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-base-content/45 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-72 w-full min-w-64 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-base-200 ${isSelected ? 'bg-primary/10 text-primary' : 'text-base-content/75'}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressCard({ completionRate, solvedCount, totalProblems, progressByDifficulty }) {
  return (
    <div className="cv-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="cv-kicker">Progress</p>
          <p className="mt-2 text-4xl font-black">{completionRate}%</p>
        </div>
        <p className="font-mono text-sm text-secondary">{solvedCount}/{totalProblems}</p>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-base-300">
        <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }}></div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-base-300 pt-4 text-center">
        {['easy', 'medium', 'hard'].map((difficulty) => (
          <div key={difficulty}>
            <p className={`font-mono text-sm font-bold ${getDifficultyTone(difficulty)}`}>
              {progressByDifficulty[difficulty].solved}/{progressByDifficulty[difficulty].total}
            </p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-secondary">{difficulty}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemSkeleton() {
  return (
    <section className="cv-panel overflow-hidden p-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="flex items-center gap-5 border-b border-base-300 py-4 last:border-0">
          <div className="skeleton h-6 w-6 rounded-full"></div>
          <div className="skeleton h-4 flex-1"></div>
          <div className="skeleton h-4 w-28"></div>
          <div className="skeleton h-4 w-20"></div>
        </div>
      ))}
    </section>
  );
}

const getProgressByDifficulty = (problems, solvedProblemIds) => {
  return ['easy', 'medium', 'hard'].reduce((acc, difficulty) => {
    const matchingProblems = problems.filter((problem) => problem.difficulty === difficulty);
    acc[difficulty] = {
      total: matchingProblems.length,
      solved: matchingProblems.filter((problem) => solvedProblemIds.has(problem._id)).length,
    };
    return acc;
  }, {});
};

export default Homepage;
