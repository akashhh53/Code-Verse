import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Code2, FileSearch, XCircle } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const SubmissionHistory = ({ problemId, refreshKey = 0 }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        setSubmissions(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError('Failed to fetch submission history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId, refreshKey]);

  const stats = useMemo(() => {
    const accepted = submissions.filter((submission) => submission.status === 'accepted').length;
    const latest = submissions[0]?.createdAt ? formatDate(submissions[0].createdAt) : 'No runs yet';

    return {
      accepted,
      total: submissions.length,
      latest,
    };
  }, [submissions]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error rounded-2xl">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <HistoryStat label="Submissions" value={stats.total} icon={Clock} />
        <HistoryStat label="Accepted" value={stats.accepted} icon={CheckCircle2} />
        <HistoryStat label="Latest" value={stats.latest} icon={FileSearch} compact />
      </div>

      {submissions.length === 0 ? (
        <div className="cv-panel border-dashed p-8 text-center">
          <FileSearch className="mx-auto h-10 w-10 text-base-content/35" />
          <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
          <p className="mt-2 text-sm text-base-content/60">
            Submit a solution and your attempts will appear here.
          </p>
        </div>
      ) : (
        <div className="cv-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Cases</th>
                  <th>Submitted</th>
                  <th className="text-right">Code</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={submission._id} className="hover">
                    <td className="text-base-content/50">{index + 1}</td>
                    <td className="font-mono text-sm">{formatLanguage(submission.language)}</td>
                    <td>
                      <span className={`badge ${getStatusColor(submission.status)} gap-1`}>
                        {getStatusIcon(submission.status)}
                        {formatStatus(submission.status)}
                      </span>
                    </td>
                    <td className="font-mono text-sm">{formatRuntime(submission.runtime)}</td>
                    <td className="font-mono text-sm">{formatMemory(submission.memory)}</td>
                    <td className="font-mono text-sm">{submission.testCasesPassed}/{submission.testCasesTotal}</td>
                    <td className="text-sm text-base-content/70">{formatDate(submission.createdAt)}</td>
                    <td className="text-right">
                      <button
                        className="btn btn-outline btn-sm gap-2"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Code2 className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl rounded-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-bold">Submission Code</h3>
                <p className="mt-1 text-sm text-base-content/60">{formatLanguage(selectedSubmission.language)}</p>
              </div>
              <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                {formatStatus(selectedSubmission.status)}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <ModalMetric label="Runtime" value={formatRuntime(selectedSubmission.runtime)} />
              <ModalMetric label="Memory" value={formatMemory(selectedSubmission.memory)} />
              <ModalMetric label="Passed" value={`${selectedSubmission.testCasesPassed}/${selectedSubmission.testCasesTotal}`} />
            </div>

            {selectedSubmission.errorMessage && (
              <div className="alert alert-error mt-4 rounded-2xl">
                <AlertCircle className="h-5 w-5" />
                <span>{selectedSubmission.errorMessage}</span>
              </div>
            )}

            <pre className="mt-4 max-h-[28rem] overflow-auto rounded-2xl bg-neutral p-4 text-sm leading-6 text-neutral-content">
              <code>{selectedSubmission.code}</code>
            </pre>

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedSubmission(null)}>
                Close
              </button>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => setSelectedSubmission(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

function HistoryStat({ label, value, icon, compact }) {
  const StatIcon = icon;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StatIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-base-content/55">{label}</p>
          <p className={`${compact ? 'truncate text-sm' : 'text-2xl'} font-bold`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ModalMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-base-200 p-3">
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'accepted':
      return 'badge-success';
    case 'wrong':
      return 'badge-error';
    case 'error':
      return 'badge-warning';
    case 'pending':
      return 'badge-info';
    default:
      return 'badge-neutral';
  }
};

const getStatusIcon = (status) => {
  if (status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'wrong' || status === 'error') return <XCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
};

const formatStatus = (status = '') => status.charAt(0).toUpperCase() + status.slice(1);

const formatLanguage = (language = '') => {
  if (language === 'javascript') return 'JavaScript';
  if (language === 'c++' || language === 'cpp') return 'C++';
  return language.charAt(0).toUpperCase() + language.slice(1);
};

const formatMemory = (memory = 0) => {
  if (memory < 1024) return `${memory} KB`;
  return `${(memory / 1024).toFixed(2)} MB`;
};

const formatRuntime = (runtime = 0) => `${Number(runtime).toFixed(3)} sec`;

const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleString();
};

export default SubmissionHistory;
