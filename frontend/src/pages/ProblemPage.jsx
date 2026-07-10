import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { NavLink, useParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Code2,
  FileCode2,
  FileText,
  History,
  ListChecks,
  Play,
  Send,
  Terminal,
  Trophy,
  XCircle,
} from 'lucide-react';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const leftTabs = [
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'editorial', label: 'Editorial', icon: Trophy },
  { id: 'solutions', label: 'Solutions', icon: FileCode2 },
  { id: 'submissions', label: 'Submissions', icon: History },
  { id: 'chatAI', label: 'AI Coach', icon: Bot },
];

const rightTabs = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'testcase', label: 'Console', icon: Terminal },
  { id: 'result', label: 'Result', icon: ListChecks },
];

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  const { problemId } = useParams();

  useEffect(() => {
    let isMounted = true;

    const fetchProblem = async () => {
      setPageLoading(true);
      setPageError('');

      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        if (!isMounted) return;

        setProblem(response.data);
        setCode(getInitialCode(response.data, 'javascript'));
      } catch (error) {
        console.error('Error fetching problem:', error);
        if (isMounted) setPageError('Unable to load this problem. Please go back and try again.');
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchProblem();

    return () => {
      isMounted = false;
    };
  }, [problemId]);

  useEffect(() => {
    if (problem) {
      setCode(getInitialCode(problem, selectedLanguage));
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRun = async () => {
    setActionLoading('run');
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Could not run your code. Please try again.',
        testCases: []
      });
      setActiveRightTab('testcase');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitCode = async () => {
    setActionLoading('submit');
    setSubmitResult(null);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult({
        accepted: false,
        error: 'Could not submit your solution.',
        passedTestCases: 0,
        totalTestCases: 0
      });
      setActiveRightTab('result');
    } finally {
      setActionLoading(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 p-6">
        <div className="rounded-lg border border-base-300 bg-base-100 p-8 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <h1 className="mt-4 text-xl font-bold">Loading problem</h1>
          <p className="mt-1 text-sm text-base-content/60">Preparing the editor and examples.</p>
        </div>
      </div>
    );
  }

  if (pageError || !problem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 p-6">
        <div className="max-w-md rounded-lg border border-base-300 bg-base-100 p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-error" />
          <h1 className="mt-4 text-xl font-bold">Problem unavailable</h1>
          <p className="mt-2 text-sm text-base-content/60">{pageError || 'This problem could not be loaded.'}</p>
          <NavLink to="/" className="btn btn-primary mt-5">
            Back to Problems
          </NavLink>
        </div>
      </div>
    );
  }

  const isWorking = Boolean(actionLoading);

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <NavLink to="/" className="btn btn-ghost btn-square">
              <ArrowLeft className="h-5 w-5" />
            </NavLink>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold sm:text-xl">{problem.title}</h1>
                <span className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                  {formatLabel(problem.difficulty)}
                </span>
                <span className="badge badge-info badge-outline">{getTagLabel(problem.tags)}</span>
              </div>
              <p className="mt-1 text-xs text-base-content/55">Solve, run, submit, and review in one focused workspace.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline btn-sm gap-2" onClick={handleRun} disabled={isWorking}>
              {actionLoading === 'run' ? <span className="loading loading-spinner loading-xs"></span> : <Play className="h-4 w-4" />}
              Run
            </button>
            <button className="btn btn-primary btn-sm gap-2" onClick={handleSubmitCode} disabled={isWorking}>
              {actionLoading === 'submit' ? <span className="loading loading-spinner loading-xs"></span> : <Send className="h-4 w-4" />}
              Submit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-3 lg:h-[calc(100vh-73px)] lg:p-4">
        <div className="grid h-full gap-4 lg:grid-cols-2">
          <section className="flex min-h-[36rem] flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm lg:min-h-0">
            <TabBar tabs={leftTabs} activeTab={activeLeftTab} onChange={setActiveLeftTab} />
            <div className="flex-1 overflow-y-auto p-5">
              {activeLeftTab === 'description' && <DescriptionTab problem={problem} />}
              {activeLeftTab === 'editorial' && (
                <div className="space-y-4">
                  <SectionHeading title="Editorial" text="Use the video after you have attempted the problem or when you need a second explanation." />
                  <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                </div>
              )}
              {activeLeftTab === 'solutions' && <SolutionsTab problem={problem} />}
              {activeLeftTab === 'submissions' && <SubmissionHistory problemId={problemId} />}
              {activeLeftTab === 'chatAI' && <ChatAi problem={problem} />}
            </div>
          </section>

          <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm lg:min-h-0">
            <TabBar tabs={rightTabs} activeTab={activeRightTab} onChange={setActiveRightTab} />
            <div className="flex flex-1 flex-col overflow-hidden">
              {activeRightTab === 'code' && (
                <CodeTab
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  code={code}
                  handleEditorChange={handleEditorChange}
                  handleEditorDidMount={handleEditorDidMount}
                  handleRun={handleRun}
                  handleSubmitCode={handleSubmitCode}
                  actionLoading={actionLoading}
                />
              )}
              {activeRightTab === 'testcase' && (
                <ConsoleTab
                  problem={problem}
                  runResult={runResult}
                  actionLoading={actionLoading}
                  handleRun={handleRun}
                />
              )}
              {activeRightTab === 'result' && (
                <ResultTab
                  submitResult={submitResult}
                  actionLoading={actionLoading}
                  handleSubmitCode={handleSubmitCode}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-base-300 bg-base-200/60 p-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`btn btn-sm shrink-0 gap-2 ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DescriptionTab({ problem }) {
  return (
    <div className="space-y-7">
      <section>
        <SectionHeading title="Problem Statement" text="Read the prompt carefully before writing code." />
        <div className="mt-4 whitespace-pre-wrap rounded-lg border border-base-300 bg-base-200/50 p-5 text-sm leading-7">
          {problem.description}
        </div>
      </section>

      <section>
        <SectionHeading title="Examples" text="Use these cases to understand input and output shape." />
        <div className="mt-4 grid gap-4">
          {problem.visibleTestCases?.map((example, index) => (
            <ExampleCard key={index} example={example} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SolutionsTab({ problem }) {
  const solutions = problem.referenceSolution || [];

  return (
    <div className="space-y-4">
      <SectionHeading title="Reference Solutions" text="Compare approaches after you have made a serious attempt." />

      {solutions.length === 0 ? (
        <EmptyPanel icon={FileCode2} title="No solutions available" text="Reference solutions will appear here when they are added." />
      ) : (
        <div className="space-y-4">
          {solutions.map((solution, index) => (
            <div key={`${solution.language}-${index}`} className="overflow-hidden rounded-lg border border-base-300">
              <div className="flex items-center justify-between bg-base-200 px-4 py-3">
                <h3 className="font-semibold">{solution.language}</h3>
                <span className="badge badge-outline">Reference</span>
              </div>
              <pre className="max-h-96 overflow-auto bg-neutral p-4 text-sm leading-6 text-neutral-content">
                <code>{solution.completeCode}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeTab({
  selectedLanguage,
  setSelectedLanguage,
  code,
  handleEditorChange,
  handleEditorDidMount,
  handleRun,
  handleSubmitCode,
  actionLoading,
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-3">
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => (
            <button
              key={language.value}
              className={`btn btn-sm ${selectedLanguage === language.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedLanguage(language.value)}
            >
              {language.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-base-content/50">Editor autosizes to your screen</div>
      </div>

      <div className="min-h-[28rem] flex-1 overflow-hidden bg-neutral lg:min-h-0">
        <Editor
          height="100%"
          language={getLanguageForMonaco(selectedLanguage)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            mouseWheelZoom: true,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-3">
        <span className="text-sm text-base-content/60">Run examples first, then submit for final judging.</span>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2" onClick={handleRun} disabled={Boolean(actionLoading)}>
            {actionLoading === 'run' ? <span className="loading loading-spinner loading-xs"></span> : <Play className="h-4 w-4" />}
            Run
          </button>
          <button className="btn btn-primary btn-sm gap-2" onClick={handleSubmitCode} disabled={Boolean(actionLoading)}>
            {actionLoading === 'submit' ? <span className="loading loading-spinner loading-xs"></span> : <Send className="h-4 w-4" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsoleTab({ problem, runResult, actionLoading, handleRun }) {
  if (!runResult) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <EmptyPanel
          icon={Terminal}
          title="Run your code"
          text="Execute your solution against the visible examples and inspect the output here."
          action={
            <button className="btn btn-primary btn-sm gap-2" onClick={handleRun} disabled={Boolean(actionLoading)}>
              <Play className="h-4 w-4" />
              Run examples
            </button>
          }
        />
        <div className="mt-5 grid gap-3">
          {problem.visibleTestCases?.map((testCase, index) => (
            <ExampleCard key={index} example={testCase} index={index} compact />
          ))}
        </div>
      </div>
    );
  }

  const testCases = runResult.testCases || [];

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <ResultBanner
        success={runResult.success}
        title={runResult.success ? 'All visible cases passed' : 'Run finished with issues'}
        text={runResult.success ? 'Nice. Review the details, then submit when ready.' : runResult.error || 'Check the failed case and adjust your code.'}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Runtime" value={runResult.runtime ? `${runResult.runtime} sec` : 'N/A'} />
        <Metric label="Memory" value={runResult.memory ? `${runResult.memory} KB` : 'N/A'} />
      </div>

      <div className="mt-5 space-y-3">
        {testCases.length === 0 ? (
          <EmptyPanel icon={Terminal} title="No test details returned" text="The runner did not return individual test case output." />
        ) : (
          testCases.map((testCase, index) => (
            <TestResultCard key={index} testCase={testCase} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function ResultTab({ submitResult, actionLoading, handleSubmitCode }) {
  if (!submitResult) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <EmptyPanel
          icon={ListChecks}
          title="Submit when ready"
          text="Your judged result, performance, and passed cases will appear here."
          action={
            <button className="btn btn-primary btn-sm gap-2" onClick={handleSubmitCode} disabled={Boolean(actionLoading)}>
              <Send className="h-4 w-4" />
              Submit solution
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <ResultBanner
        success={submitResult.accepted}
        title={submitResult.accepted ? 'Accepted' : 'Not accepted yet'}
        text={submitResult.accepted ? 'Your solution passed the judge test suite.' : submitResult.error || 'Review the failing cases and try again.'}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Passed" value={`${submitResult.passedTestCases ?? 0}/${submitResult.totalTestCases ?? 0}`} />
        <Metric label="Runtime" value={submitResult.runtime ? `${submitResult.runtime} sec` : 'N/A'} />
        <Metric label="Memory" value={submitResult.memory ? `${submitResult.memory} KB` : 'N/A'} />
      </div>
    </div>
  );
}

function SectionHeading({ title, text }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {text && <p className="mt-1 text-sm leading-6 text-base-content/60">{text}</p>}
    </div>
  );
}

function ExampleCard({ example, index, compact }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Example {index + 1}</h3>
        <span className="badge badge-outline">Visible</span>
      </div>
      <div className={`grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        <CodeLine label="Input" value={example.input} />
        <CodeLine label="Output" value={example.output} />
        {example.explanation && (
          <div className={compact ? '' : 'md:col-span-2'}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/50">Explanation</p>
            <p className="rounded-lg bg-base-200 p-3 text-sm leading-6">{example.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeLine({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/50">{label}</p>
      <pre className="overflow-auto rounded-lg bg-neutral p-3 text-sm text-neutral-content">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function EmptyPanel({ icon, title, text, action }) {
  const EmptyIcon = icon;

  return (
    <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center">
      <EmptyIcon className="mx-auto h-10 w-10 text-base-content/35" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/60">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function ResultBanner({ success, title, text }) {
  return (
    <div className={`rounded-lg border p-5 ${success ? 'border-success/30 bg-success/10' : 'border-error/30 bg-error/10'}`}>
      <div className="flex gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${success ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
          {success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </span>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-base-content/70">{text}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function TestResultCard({ testCase, index }) {
  const passed = Number(testCase.status_id) === 3;

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Case {index + 1}</h3>
        <span className={`badge ${passed ? 'badge-success' : 'badge-error'}`}>
          {passed ? 'Passed' : 'Failed'}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <CodeLine label="Input" value={testCase.stdin} />
        <CodeLine label="Expected" value={testCase.expected_output} />
        <CodeLine label="Output" value={testCase.stdout || testCase.stderr || 'No output'} />
      </div>
    </div>
  );
}

const getInitialCode = (problem, language) => {
  return problem?.startCode?.find((starter) => starter.language === langMap[language])?.initialCode || '';
};

const getLanguageForMonaco = (lang) => {
  switch (lang) {
    case 'javascript':
      return 'javascript';
    case 'java':
      return 'java';
    case 'cpp':
      return 'cpp';
    default:
      return 'javascript';
  }
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

export default ProblemPage;
