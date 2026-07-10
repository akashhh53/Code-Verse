import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import { AlertTriangle, ArrowLeft, PlaySquare, RefreshCw, Search, Trash2, Upload, Video } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!window.confirm('Delete the video connected to this problem?')) return;

    try {
      setDeletingId(id);
      setNotice('');
      await axiosClient.delete(`/video/delete/${id}`);
      setNotice('Video deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete video.');
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
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-info/10 px-3 py-1 text-sm font-medium text-info">
                <PlaySquare className="h-4 w-4" />
                Learning content
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Video Library</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/70">
                Upload editorials and manage videos attached to your coding problems.
              </p>
            </div>

            <div className="stats stats-vertical border border-base-300 bg-base-200/50 shadow-none sm:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Problems</div>
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
              placeholder="Search problems before uploading a video"
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
              <Video className="mx-auto h-10 w-10 text-base-content/35" />
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
                    <th className="text-right">Actions</th>
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
                      <td>
                        <div className="flex justify-end gap-2">
                          <NavLink to={`/admin/upload/${problem._id}`} className="btn btn-primary btn-sm gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                          </NavLink>
                          <button
                            onClick={() => handleDelete(problem._id)}
                            className="btn btn-error btn-outline btn-sm gap-2"
                            disabled={deletingId === problem._id}
                          >
                            {deletingId === problem._id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete video
                          </button>
                        </div>
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

export default AdminVideo;
