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
  Plus,
  Send,
  Terminal,
  Trophy,
  Trash2,
  XCircle,
} from 'lucide-react';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { ThemeToggle } from '../components/CodeVerseUI';
import {
  formatLabel,
  getDifficultyDot,
  getDifficultyTone,
  getInitialCode,
  getTagLabel,
  languageOptions,
} from '../utils/problemMeta';

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

const createEmptyCustomTestCase = (example) => {
  const fields = parseInputFields(example?.input);

  if (!fields.length) {
    return {
      input: '',
      output: example?.output || '',
      fields: [],
    };
  }

  return {
    input: '',
    output: example?.output || '',
    fields,
  };
};

function parseInputFields(input = '') {
  if (!input.trim()) return [];

  const segments = splitTopLevel(input.replace(/\n+/g, ','));
  const fields = segments.map((segment) => {
    const match = segment.match(/^\s*([A-Za-z_$][\w$]*)\s*=\s*(.+)\s*$/);

    if (!match) return null;

    return {
      name: match[1],
      value: match[2].trim(),
      exampleValue: match[2].trim(),
    };
  });

  if (fields.some((field) => !field)) return [];
  return fields;
}

function splitTopLevel(value) {
  const segments = [];
  let current = '';
  const stack = [];
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previousChar = value[index - 1];

    if (quote) {
      current += char;
      if (char === quote && previousChar !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[' || char === '{' || char === '(') {
      stack.push(char);
      current += char;
      continue;
    }

    if (char === ']' || char === '}' || char === ')') {
      stack.pop();
      current += char;
      continue;
    }

    if (char === ',' && stack.length === 0) {
      if (current.trim()) segments.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) segments.push(current.trim());
  return segments;
}

function getCustomTestCaseInput(testCase) {
  if (testCase.fields?.length) {
    return testCase.fields
      .map((field) => `${field.name} = ${field.value.trim()}`)
      .join(', ');
  }

  return testCase.input || '';
}

function validateCustomTestCases(customTestCases) {
  const errors = {};
  let filledCases = 0;

  customTestCases.forEach((testCase, index) => {
    const input = getCustomTestCaseInput(testCase);
    const output = testCase.output || '';
    const hasInput = input.trim().length > 0;
    const hasOutput = output.trim().length > 0;

    if (!hasInput && !hasOutput) return;

    filledCases += 1;

    if (testCase.fields?.length) {
      const emptyField = testCase.fields.find((field) => !field.value.trim());
      if (emptyField) {
        errors[index] = `${emptyField.name} is missing. Enter a value in the same format as the example.`;
        return;
      }
    }

    if (!hasInput) {
      errors[index] = 'Input is required. Expected output is optional, but input cannot be empty.';
      return;
    }

    if (!hasBalancedSyntax(input)) {
      errors[index] = 'The input has an incomplete bracket or quote. Check the example format.';
      return;
    }

    if (hasOutput && !hasBalancedSyntax(output)) {
      errors[index] = 'The expected output has an incomplete bracket or quote.';
    }
  });

  if (filledCases === 0) {
    return {
      isValid: false,
      errors: { 0: 'Enter at least one custom input.' },
      message: 'Add a valid custom input before running.',
    };
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    message: isValid ? '' : 'Custom input is invalid. Fix the highlighted fields.',
  };
}

function hasBalancedSyntax(value) {
  const pairs = {
    ']': '[',
    '}': '{',
    ')': '(',
  };
  const opening = new Set(Object.values(pairs));
  const stack = [];
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previousChar = value[index - 1];

    if (quote) {
      if (char === quote && previousChar !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (opening.has(char)) {
      stack.push(char);
      continue;
    }

    if (pairs[char]) {
      if (stack.pop() !== pairs[char]) return false;
    }
  }

  return !quote && stack.length === 0;
}

const resolveEditorTheme = () => {
  if (typeof document === 'undefined') return 'codeverse-dark-editor';
  return document.documentElement.getAttribute('data-theme') === 'codeverse-light'
    ? 'codeverse-light-editor'
    : 'codeverse-dark-editor';
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submissionRefreshKey, setSubmissionRefreshKey] = useState(0);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [customTestCases, setCustomTestCases] = useState([createEmptyCustomTestCase()]);
  const [customTestCaseErrors, setCustomTestCaseErrors] = useState({});
  const [editorTheme, setEditorTheme] = useState(resolveEditorTheme);
  const editorRef = useRef(null);
  const { problemId } = useParams();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEditorTheme(resolveEditorTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    setEditorTheme(resolveEditorTheme());

    return () => observer.disconnect();
  }, []);

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
        setCustomTestCases([createEmptyCustomTestCase(response.data.visibleTestCases?.[0])]);
        setCustomTestCaseErrors({});
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

  const getPreparedCustomTestCases = () => {
    return customTestCases
      .map((testCase) => ({
        input: getCustomTestCaseInput(testCase),
        output: testCase.output,
      }))
      .filter((testCase) => testCase.input.trim() || testCase.output.trim());
  };

  const updateCustomTestCase = (index, field, value) => {
    setCustomTestCases((currentCases) =>
      currentCases.map((testCase, testCaseIndex) =>
        testCaseIndex === index ? { ...testCase, [field]: value } : testCase
      )
    );
    setCustomTestCaseErrors((currentErrors) => ({ ...currentErrors, [index]: null }));
  };

  const updateCustomTestCaseField = (caseIndex, fieldIndex, value) => {
    setCustomTestCases((currentCases) =>
      currentCases.map((testCase, testCaseIndex) =>
        testCaseIndex === caseIndex
          ? {
              ...testCase,
              fields: testCase.fields.map((field, currentFieldIndex) =>
                currentFieldIndex === fieldIndex ? { ...field, value } : field
              ),
            }
          : testCase
      )
    );
    setCustomTestCaseErrors((currentErrors) => ({ ...currentErrors, [caseIndex]: null }));
  };

  const addCustomTestCase = () => {
    setCustomTestCases((currentCases) => {
      if (currentCases.length >= 5) return currentCases;
      return [...currentCases, createEmptyCustomTestCase(problem.visibleTestCases?.[0])];
    });
    setCustomTestCaseErrors({});
  };

  const removeCustomTestCase = (index) => {
    setCustomTestCases((currentCases) => {
      if (currentCases.length === 1) return currentCases;
      return currentCases.filter((_, testCaseIndex) => testCaseIndex !== index);
    });
    setCustomTestCaseErrors({});
  };

  const handleRun = async ({ useCustom = false } = {}) => {
    const validation = useCustom ? validateCustomTestCases(customTestCases) : { isValid: true, errors: {} };
    const preparedCustomTestCases = useCustom && validation.isValid ? getPreparedCustomTestCases() : [];

    if (useCustom && (!validation.isValid || preparedCustomTestCases.length === 0)) {
      setCustomTestCaseErrors(validation.errors);
      setRunResult({
        success: false,
        mode: 'custom',
        error: validation.message || 'Add a valid custom input before running.',
        testCases: [],
      });
      setActiveRightTab('testcase');
      return;
    }

    setActionLoading('run');
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
        ...(preparedCustomTestCases.length ? { customTestCases: preparedCustomTestCases } : {}),
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
      setSubmissionRefreshKey((key) => key + 1);
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
        <div className="cv-panel p-8 text-center">
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
        <div className="cv-panel max-w-md p-8 text-center">
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
    <div className="cv-page">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-200/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <NavLink to="/" className="btn btn-ghost btn-square rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </NavLink>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold sm:text-xl">{problem.title}</h1>
                <span className={`inline-flex items-center gap-2 rounded-full border border-base-300 px-3 py-1 text-xs font-bold ${getDifficultyTone(problem.difficulty)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${getDifficultyDot(problem.difficulty)}`}></span>
                  {formatLabel(problem.difficulty)}
                </span>
                <span className="badge badge-info badge-outline">{getTagLabel(problem.tags)}</span>
              </div>
              <p className="mt-1 text-xs text-base-content/55">Solve, run, submit, and review in one focused workspace.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <button className="btn btn-outline btn-sm rounded-full gap-2" onClick={handleRun} disabled={isWorking}>
              {actionLoading === 'run' ? <span className="loading loading-spinner loading-xs"></span> : <Play className="h-4 w-4" />}
              Run
            </button>
            <button className="btn btn-primary btn-sm rounded-full gap-2" onClick={handleSubmitCode} disabled={isWorking}>
              {actionLoading === 'submit' ? <span className="loading loading-spinner loading-xs"></span> : <Send className="h-4 w-4" />}
              Submit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-3 lg:h-[calc(100vh-73px)] lg:p-4">
        <div className="grid h-full gap-4 lg:grid-cols-2">
          <section className="cv-panel flex min-h-[36rem] flex-col overflow-hidden lg:min-h-0">
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
              {activeLeftTab === 'submissions' && <SubmissionHistory problemId={problemId} refreshKey={submissionRefreshKey} />}
              {activeLeftTab === 'chatAI' && <ChatAi problem={problem} />}
            </div>
          </section>

          <section className="cv-panel flex min-h-[42rem] flex-col overflow-hidden lg:min-h-0">
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
                  editorTheme={editorTheme}
                />
              )}
              {activeRightTab === 'testcase' && (
                <ConsoleTab
                  problem={problem}
                  runResult={runResult}
                  actionLoading={actionLoading}
                  handleRun={handleRun}
                  customTestCases={customTestCases}
                  onCustomTestCaseChange={updateCustomTestCase}
                  onCustomFieldChange={updateCustomTestCaseField}
                  onAddCustomTestCase={addCustomTestCase}
                  onRemoveCustomTestCase={removeCustomTestCase}
                  customTestCaseErrors={customTestCaseErrors}
                />
              )}
              {activeRightTab === 'result' && (
                <ResultTab
                  submitResult={submitResult}
                  actionLoading={actionLoading}
                  handleSubmitCode={handleSubmitCode}
                  openSubmissions={() => setActiveLeftTab('submissions')}
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
            className={`btn btn-sm shrink-0 rounded-full gap-2 ${isActive ? 'btn-primary' : 'btn-ghost'}`}
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
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-base-300 bg-base-200/50 p-5 text-sm leading-7">
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
            <div key={`${solution.language}-${index}`} className="overflow-hidden rounded-2xl border border-base-300">
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
  editorTheme,
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-3">
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => (
            <button
              key={language.value}
              className={`btn btn-sm rounded-full ${selectedLanguage === language.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedLanguage(language.value)}
            >
              {language.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-base-content/50">Editor autosizes to your screen</div>
      </div>

      <div className={`min-h-[28rem] flex-1 overflow-hidden lg:min-h-0 ${editorTheme === 'codeverse-light-editor' ? 'bg-slate-50' : 'bg-neutral'}`}>
        <Editor
          height="100%"
          language={getLanguageForMonaco(selectedLanguage)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={defineCodeVerseEditorThemes}
          theme={editorTheme}
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
          <button className="btn btn-outline btn-sm rounded-full gap-2" onClick={handleRun} disabled={Boolean(actionLoading)}>
            {actionLoading === 'run' ? <span className="loading loading-spinner loading-xs"></span> : <Play className="h-4 w-4" />}
            Run
          </button>
          <button className="btn btn-primary btn-sm rounded-full gap-2" onClick={handleSubmitCode} disabled={Boolean(actionLoading)}>
            {actionLoading === 'submit' ? <span className="loading loading-spinner loading-xs"></span> : <Send className="h-4 w-4" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsoleTab({
  problem,
  runResult,
  actionLoading,
  handleRun,
  customTestCases,
  onCustomTestCaseChange,
  onCustomFieldChange,
  onAddCustomTestCase,
  onRemoveCustomTestCase,
  customTestCaseErrors,
}) {
  const testCases = runResult?.testCases || [];
  const isCustomRun = runResult?.mode === 'custom';

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <CustomTestcasePanel
        customTestCases={customTestCases}
        onChange={onCustomTestCaseChange}
        onFieldChange={onCustomFieldChange}
        onAdd={onAddCustomTestCase}
        onRemove={onRemoveCustomTestCase}
        onRunExamples={() => handleRun()}
        onRunCustom={() => handleRun({ useCustom: true })}
        actionLoading={actionLoading}
        errors={customTestCaseErrors}
      />

      {!runResult ? (
        <>
        <EmptyPanel
          icon={Terminal}
          title="Run your code"
          text="Execute your solution against the visible examples and inspect the output here."
          action={
            <button className="btn btn-primary btn-sm rounded-full gap-2" onClick={() => handleRun()} disabled={Boolean(actionLoading)}>
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
        </>
      ) : (
        <>
          <ResultBanner
            success={runResult.success}
            title={
              isCustomRun
                ? runResult.success ? 'Custom run completed' : 'Custom run has issues'
                : runResult.success ? 'All visible cases passed' : 'Run finished with issues'
            }
            text={
              runResult.success
                ? isCustomRun ? 'Custom input ran successfully. Verify the output, then submit when ready.' : 'Nice. Review the details, then submit when ready.'
                : runResult.error || 'Check the failed case and adjust your code.'
            }
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
        </>
      )}
    </div>
  );
}

function CustomTestcasePanel({ customTestCases, onChange, onFieldChange, onAdd, onRemove, onRunExamples, onRunCustom, actionLoading, errors }) {
  return (
    <section className="mb-5 rounded-2xl border border-base-300 bg-base-100 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Custom Testcases</h3>
          <p className="mt-1 text-sm text-base-content/55">Fill the fields using the example format. The input preview updates automatically; expected output is optional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm rounded-full gap-2" onClick={onRunExamples} disabled={Boolean(actionLoading)}>
            <Play className="h-4 w-4" />
            Run examples
          </button>
          <button type="button" className="btn btn-primary btn-sm rounded-full gap-2" onClick={onRunCustom} disabled={Boolean(actionLoading)}>
            {actionLoading === 'run' ? <span className="loading loading-spinner loading-xs"></span> : <Terminal className="h-4 w-4" />}
            Run custom
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {customTestCases.map((testCase, index) => (
          <div key={index} className={`rounded-2xl border bg-base-200/50 p-3 ${errors?.[index] ? 'border-error/60' : 'border-base-300'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Custom case {index + 1}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs rounded-full text-error"
                onClick={() => onRemove(index)}
                disabled={customTestCases.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            {testCase.fields?.length ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {testCase.fields.map((field, fieldIndex) => (
                    <label key={`${field.name}-${fieldIndex}`}>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/50">{field.name}</span>
                      <input
                        className="input input-bordered w-full rounded-2xl font-mono text-sm"
                        placeholder={field.exampleValue || 'value'}
                        value={field.value}
                        onChange={(event) => onFieldChange(index, fieldIndex, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/50">Input preview</p>
                  <pre className="overflow-auto rounded-2xl bg-neutral p-3 text-sm text-neutral-content">
                    <code>{getCustomTestCaseInput(testCase) || 'Fill fields above'}</code>
                  </pre>
                </div>
              </>
            ) : (
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/50">Input</span>
                <textarea
                  className="textarea textarea-bordered min-h-24 w-full rounded-2xl font-mono text-sm"
                  placeholder="Paste input using the example format"
                  value={testCase.input}
                  onChange={(event) => onChange(index, 'input', event.target.value)}
                />
              </label>
            )}

            <div className="mt-3">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/50">Expected output optional</span>
                <textarea
                  className="textarea textarea-bordered min-h-20 w-full rounded-2xl font-mono text-sm"
                  placeholder="Expected output, if you want comparison"
                  value={testCase.output}
                  onChange={(event) => onChange(index, 'output', event.target.value)}
                />
              </label>
            </div>
            {errors?.[index] && (
              <p className="mt-2 rounded-2xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {errors[index]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-outline btn-sm mt-3 rounded-full gap-2" onClick={onAdd} disabled={customTestCases.length >= 5}>
        <Plus className="h-4 w-4" />
        Add testcase
      </button>
    </section>
  );
}

function ResultTab({ submitResult, actionLoading, handleSubmitCode, openSubmissions }) {
  if (!submitResult) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <EmptyPanel
          icon={ListChecks}
          title="Submit when ready"
          text="Your judged result, performance, and passed cases will appear here."
          action={
            <button className="btn btn-primary btn-sm rounded-full gap-2" onClick={handleSubmitCode} disabled={Boolean(actionLoading)}>
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

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary rounded-full gap-2" onClick={openSubmissions}>
          <History className="h-4 w-4" />
          View latest submissions
        </button>
        {!submitResult.accepted && (
          <button className="btn btn-outline rounded-full gap-2" onClick={handleSubmitCode} disabled={Boolean(actionLoading)}>
            <Send className="h-4 w-4" />
            Try submit again
          </button>
        )}
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
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
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
            <p className="rounded-2xl bg-base-200 p-3 text-sm leading-6">{example.explanation}</p>
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
      <pre className="overflow-auto rounded-2xl bg-neutral p-3 text-sm text-neutral-content">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function EmptyPanel({ icon, title, text, action }) {
  const EmptyIcon = icon;

  return (
    <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
      <EmptyIcon className="mx-auto h-10 w-10 text-base-content/35" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/60">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function ResultBanner({ success, title, text }) {
  return (
    <div className={`rounded-2xl border p-5 ${success ? 'border-success/30 bg-success/10' : 'border-error/30 bg-error/10'}`}>
      <div className="flex gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${success ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
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
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function TestResultCard({ testCase, index }) {
  const passed = Number(testCase.status_id) === 3;
  const hasExpectedOutput = testCase.hasExpectedOutput ?? Boolean(String(testCase.expected_output || '').trim());
  const badgeClass = hasExpectedOutput ? (passed ? 'badge-success' : 'badge-error') : (passed ? 'badge-info' : 'badge-error');
  const badgeText = hasExpectedOutput ? (passed ? 'Passed' : 'Failed') : (passed ? 'Ran' : 'Issue');

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Case {index + 1}</h3>
        <span className={`badge ${badgeClass}`}>
          {badgeText}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <CodeLine label="Input" value={testCase.stdin} />
        <CodeLine label="Expected" value={hasExpectedOutput ? testCase.expected_output : 'Not provided'} />
        <CodeLine label="Output" value={testCase.stdout || testCase.stderr || 'No output'} />
      </div>
    </div>
  );
}

const defineCodeVerseEditorThemes = (monaco) => {
  monaco.editor.defineTheme('codeverse-light-editor', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'string', foreground: '047857' },
      { token: 'number', foreground: 'b45309' },
      { token: 'type', foreground: '2563eb' },
    ],
    colors: {
      'editor.background': '#f8fafc',
      'editor.foreground': '#111827',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#f59e0b',
      'editorCursor.foreground': '#f59e0b',
      'editor.selectionBackground': '#fde68a99',
      'editor.inactiveSelectionBackground': '#fde68a55',
      'editor.lineHighlightBackground': '#e2e8f080',
      'editorIndentGuide.background1': '#e2e8f0',
      'editorIndentGuide.activeBackground1': '#f59e0b',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#dbe3ee',
    },
  });

  monaco.editor.defineTheme('codeverse-dark-editor', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#090d12',
      'editor.foreground': '#f8fafc',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#ffb11a',
      'editorCursor.foreground': '#ffb11a',
      'editor.selectionBackground': '#ffb11a33',
      'editor.lineHighlightBackground': '#17202b',
      'editorWidget.background': '#12161d',
      'editorWidget.border': '#222a35',
    },
  });
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

export default ProblemPage;
