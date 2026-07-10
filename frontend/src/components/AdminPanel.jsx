import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Code2, FileCode2, FlaskConical, Info, Plus, Save, Trash2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const languageTemplates = ['C++', 'Java', 'JavaScript'];

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminPanel() {
  const navigate = useNavigate();
  const [submitState, setSubmitState] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: languageTemplates.map((language) => ({ language, initialCode: '' })),
      referenceSolution: languageTemplates.map((language) => ({ language, completeCode: '' }))
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    setSubmitState(null);

    try {
      await axiosClient.post('/problem/create', data);
      setSubmitState({ type: 'success', message: 'Problem created successfully. Redirecting to dashboard.' });
      setTimeout(() => navigate('/'), 700);
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.response?.data?.message || error.response?.data || error.message || 'Could not create problem.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <NavLink to="/admin" className="btn btn-ghost gap-2">
            <ArrowLeft className="h-4 w-4" />
            Admin
          </NavLink>
          <div className="badge badge-primary badge-outline px-3 py-3">Problem builder</div>
        </div>

        <section className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <FileCode2 className="h-4 w-4" />
                Create content
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create New Problem</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/70">
                Add the full problem package: statement, tags, visible tests, hidden tests, starter code, and reference solutions.
              </p>
            </div>
          </div>
        </section>

        {submitState && (
          <div className={`alert mt-6 rounded-lg ${submitState.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {submitState.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            <span>{submitState.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormSection
            icon={Info}
            title="Basic Information"
            description="Give learners enough context to understand the challenge quickly."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control lg:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Problem title</span>
                </label>
                <input
                  {...register('title')}
                  placeholder="Two Sum"
                  className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                />
                <ErrorText message={errors.title?.message} />
              </div>

              <div className="form-control lg:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Explain the task, inputs, outputs, and important constraints."
                  className={`textarea textarea-bordered min-h-36 w-full ${errors.description ? 'textarea-error' : ''}`}
                />
                <ErrorText message={errors.description?.message} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className={`select select-bordered w-full ${errors.difficulty ? 'select-error' : ''}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Topic</span>
                </label>
                <select
                  {...register('tags')}
                  className={`select select-bordered w-full ${errors.tags ? 'select-error' : ''}`}
                >
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">Dynamic Programming</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={FlaskConical}
            title="Visible Test Cases"
            description="These examples appear on the problem page and teach the expected behavior."
            action={
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="h-4 w-4" />
                Add case
              </button>
            }
          >
            <ErrorText message={errors.visibleTestCases?.message} />
            <div className="space-y-4">
              {visibleFields.map((field, index) => (
                <TestCaseBox
                  key={field.id}
                  title={`Visible case ${index + 1}`}
                  onRemove={() => removeVisible(index)}
                  canRemove={visibleFields.length > 1}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <FieldInput
                      register={register}
                      name={`visibleTestCases.${index}.input`}
                      label="Input"
                      placeholder="nums = [2,7,11,15], target = 9"
                      error={errors.visibleTestCases?.[index]?.input?.message}
                    />
                    <FieldInput
                      register={register}
                      name={`visibleTestCases.${index}.output`}
                      label="Output"
                      placeholder="[0,1]"
                      error={errors.visibleTestCases?.[index]?.output?.message}
                    />
                    <div className="form-control lg:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">Explanation</span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.explanation`)}
                        placeholder="Explain why this output is correct."
                        className={`textarea textarea-bordered min-h-24 w-full ${errors.visibleTestCases?.[index]?.explanation ? 'textarea-error' : ''}`}
                      />
                      <ErrorText message={errors.visibleTestCases?.[index]?.explanation?.message} />
                    </div>
                  </div>
                </TestCaseBox>
              ))}
            </div>
          </FormSection>

          <FormSection
            icon={FlaskConical}
            title="Hidden Test Cases"
            description="These tests validate submissions without being shown to learners."
            action={
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="h-4 w-4" />
                Add case
              </button>
            }
          >
            <ErrorText message={errors.hiddenTestCases?.message} />
            <div className="space-y-4">
              {hiddenFields.map((field, index) => (
                <TestCaseBox
                  key={field.id}
                  title={`Hidden case ${index + 1}`}
                  onRemove={() => removeHidden(index)}
                  canRemove={hiddenFields.length > 1}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <FieldInput
                      register={register}
                      name={`hiddenTestCases.${index}.input`}
                      label="Input"
                      placeholder="Large edge-case input"
                      error={errors.hiddenTestCases?.[index]?.input?.message}
                    />
                    <FieldInput
                      register={register}
                      name={`hiddenTestCases.${index}.output`}
                      label="Output"
                      placeholder="Expected result"
                      error={errors.hiddenTestCases?.[index]?.output?.message}
                    />
                  </div>
                </TestCaseBox>
              ))}
            </div>
          </FormSection>

          <FormSection
            icon={Code2}
            title="Code Templates"
            description="Provide starter code and complete reference solutions for every supported language."
          >
            <div className="space-y-5">
              {languageTemplates.map((language, index) => (
                <div key={language} className="rounded-lg border border-base-300 bg-base-200/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Code2 className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold">{language}</h3>
                  </div>

                  <input type="hidden" {...register(`startCode.${index}.language`)} value={language} />
                  <input type="hidden" {...register(`referenceSolution.${index}.language`)} value={language} />

                  <div className="grid gap-4 xl:grid-cols-2">
                    <CodeTextarea
                      register={register}
                      name={`startCode.${index}.initialCode`}
                      label="Starter code"
                      error={errors.startCode?.[index]?.initialCode?.message}
                    />
                    <CodeTextarea
                      register={register}
                      name={`referenceSolution.${index}.completeCode`}
                      label="Reference solution"
                      error={errors.referenceSolution?.[index]?.completeCode?.message}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          <div className="sticky bottom-4 z-20 rounded-lg border border-base-300 bg-base-100 p-3 shadow-lg">
            <button type="submit" className="btn btn-primary w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating problem
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Problem
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormSection({ icon, title, description, action, children }) {
  const SectionIcon = icon;

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SectionIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-base-content/60">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TestCaseBox({ title, onRemove, canRemove, children }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button type="button" className="btn btn-error btn-outline btn-xs gap-1" onClick={onRemove} disabled={!canRemove}>
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ register, name, label, placeholder, error }) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
      <input
        {...register(name)}
        placeholder={placeholder}
        className={`input input-bordered w-full font-mono text-sm ${error ? 'input-error' : ''}`}
      />
      <ErrorText message={error} />
    </div>
  );
}

function CodeTextarea({ register, name, label, error }) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
      <textarea
        {...register(name)}
        rows={10}
        spellCheck="false"
        className={`textarea textarea-bordered w-full font-mono text-sm leading-6 ${error ? 'textarea-error' : ''}`}
      />
      <ErrorText message={error} />
    </div>
  );
}

function ErrorText({ message }) {
  if (!message) return null;
  return <span className="mt-1 text-sm text-error">{message}</span>;
}

export default AdminPanel;
