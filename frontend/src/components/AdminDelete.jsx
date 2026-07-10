import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import { AlertTriangle, ArrowLeft, BookOpen, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const AdminDelete = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState('');

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setProblems([]);
        return;
      }

      setError('Failed to fetch problems. Please refresh and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const filteredProblems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return problems;

    return problems.filter((problem) =>
      [problem.title, problem.difficulty, problem.tags]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [problems, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem? This cannot be undone.')) return;

    try {
      setDeletingId(id);
      setNotice('');
      await axiosClient.delete(`/problem/delete/${id}`);
      setProblems((currentProblems) => currentProblems.filter((problem) => problem._id !== id));
      setNotice('Problem deleted successfully.');
    } catch (err) {
      setError('Failed to delete problem.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <NavLink to="/admin" className="btn btn-ghost gap-2">
            <ArrowLeft className="h-4 w-4" />
            Admin
          </NavLink>
          <button type="button" className="btn btn-outline btn-sm gap-2" onClick={fetchProblems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <section className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-error/10 px-3 py-1 text-sm font-medium text-error">
                <ShieldAlert className="h-4 w-4" />
                Careful action
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Delete Problems</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/70">
                Review your catalog before removing a problem from the platform.
              </p>
            </div>

            <div className="stats stats-vertical border border-base-300 bg-base-200/50 shadow-none sm:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Total</div>
                <div className="stat-value text-2xl">{problems.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Showing</div>
                <div className="stat-value text-2xl">{filteredProblems.length}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
          <label className="input input-bordered flex items-center gap-2">
            <Search className="h-4 w-4 text-base-content/45" />
            <input
              type="search"
              className="grow"
              placeholder="Search by title, difficulty, or topic"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </section>

        {notice && (
          <div className="alert alert-success mt-6 rounded-lg">
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-6 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-base-content/35" />
              <h2 className="mt-4 text-lg font-semibold">No problems found</h2>
              <p className="mt-2 text-sm text-base-content/60">Try a different search or refresh the list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Problem</th>
                    <th>Difficulty</th>
                    <th>Topic</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem, index) => (
                    <tr key={problem._id} className="hover">
                      <td className="text-base-content/50">{index + 1}</td>
                      <td>
                        <div className="font-semibold">{problem.title}</div>
                        <div className="text-xs text-base-content/50">{problem._id}</div>
                      </td>
                      <td>
                        <span className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                          {formatLabel(problem.difficulty)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">{getTagLabel(problem.tags)}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(problem._id)}
                          className="btn btn-error btn-sm gap-2"
                          disabled={deletingId === problem._id}
                        >
                          {deletingId === problem._id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const formatLabel = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

const getTagLabel = (tag) => {
  const labels = {
    array: 'Array',
    linkedList: 'Linked List',
    graph: 'Graph',
    dp: 'Dynamic Programming',
  };

  return labels[tag] || tag;
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

export default AdminDelete;
