import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, BookOpen, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { BackBar, EmptyState, HeroPanel, PageShell, StatCard } from './CodeVerseUI';
import { formatLabel, getDifficultyDot, getDifficultyTone, getTagLabel } from '../utils/problemMeta';

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
    <div className="cv-page">
      <PageShell>
        <BackBar
          to="/admin"
          label="Admin"
          right={(
            <button type="button" className="btn btn-outline btn-sm rounded-full gap-2" onClick={fetchProblems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
            </button>
          )}
        />

        <HeroPanel
          eyebrow="Careful action"
          title="Delete Problems"
          subtitle="Review your catalog before removing a problem from the platform."
          icon={ShieldAlert}
        >
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-80">
            <StatCard label="Total" value={problems.length} />
            <StatCard label="Showing" value={filteredProblems.length} />
          </div>
        </HeroPanel>

        <section className="cv-panel mt-6 p-4">
          <label className="cv-control flex items-center gap-3 px-4">
            <Search className="h-4 w-4 text-base-content/45" />
            <input
              type="search"
              className="w-full bg-transparent outline-none placeholder:text-base-content/45"
              placeholder="Search by title, difficulty, or topic"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </section>

        {notice && (
          <div className="alert alert-success mt-6 rounded-2xl">
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-6 rounded-2xl">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <section className="cv-panel mt-6 overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <EmptyState icon={BookOpen} title="No problems found" text="Try a different search or refresh the list." />
          ) : (
            <div className="overflow-x-auto">
              <table className="cv-table min-w-[760px]">
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
                        <div className="font-bold">{problem.title}</div>
                        <div className="text-xs text-base-content/50">{problem._id}</div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-2 font-semibold ${getDifficultyTone(problem.difficulty)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${getDifficultyDot(problem.difficulty)}`}></span>
                          {formatLabel(problem.difficulty)}
                        </span>
                      </td>
                      <td>
                        <span className="rounded-full border border-base-300 px-3 py-1 text-xs text-secondary">{getTagLabel(problem.tags)}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(problem._id)}
                          className="btn btn-error btn-sm rounded-full gap-2"
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
      </PageShell>
    </div>
  );
};

export default AdminDelete;
