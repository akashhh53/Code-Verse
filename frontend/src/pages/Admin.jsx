import { ArrowRight, Edit, Library, Plus, ShieldCheck, Trash2, Video } from 'lucide-react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppHeader, HeroPanel, PageShell, StatCard } from '../components/CodeVerseUI';
import { logoutUser } from '../authSlice';

const adminOptions = [
  {
    id: 'create',
    title: 'Create Problem',
    description: 'Build a full challenge with statement, tests, starter code, and reference solutions.',
    icon: Plus,
    route: '/admin/create',
    meta: 'Problem builder',
    tone: 'text-success',
  },
  {
    id: 'update',
    title: 'Update Problem',
    description: 'Edit existing problem details when the update workflow is connected.',
    icon: Edit,
    route: null,
    meta: 'Coming soon',
    tone: 'text-warning',
  },
  {
    id: 'delete',
    title: 'Delete Problem',
    description: 'Review and remove outdated or incorrect challenges from the catalog.',
    icon: Trash2,
    route: '/admin/delete',
    meta: 'Careful action',
    tone: 'text-error',
  },
  {
    id: 'video',
    title: 'Video Library',
    description: 'Upload and manage editorial videos linked to problems.',
    icon: Video,
    route: '/admin/video',
    meta: 'Learning content',
    tone: 'text-info',
  },
];

function Admin() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const liveTools = adminOptions.filter((option) => option.route).length;

  return (
    <div className="cv-page">
      <AppHeader user={user} onLogout={() => dispatch(logoutUser())} active="admin" />

      <PageShell>
        <HeroPanel
          eyebrow="Platform control center"
          title="Admin Workspace"
          subtitle="Manage your problem catalog, keep content fresh, and guide learners with clean editorials."
          icon={Library}
        >
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[28rem]">
            <StatCard label="Tools" value={adminOptions.length} />
            <StatCard label="Live" value={liveTools} tone="text-success" />
            <StatCard label="Queued" value={adminOptions.length - liveTools} tone="text-warning" />
          </div>
        </HeroPanel>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;

            return (
              <article key={option.id} className="cv-panel flex min-h-72 flex-col p-5 transition hover:-translate-y-1 hover:border-primary/60">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200 ${option.tone}`}>
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="mt-5 flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-base-300 px-3 py-1 text-xs text-secondary">
                    {option.id === 'create' && <ShieldCheck className="h-3.5 w-3.5" />}
                    {option.meta}
                  </div>
                  <h2 className="text-xl font-black">{option.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-base-content/58">{option.description}</p>
                </div>

                {option.route ? (
                  <NavLink to={option.route} className="btn btn-primary btn-sm mt-6 w-full rounded-full gap-2">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </NavLink>
                ) : (
                  <button type="button" className="btn btn-disabled btn-sm mt-6 w-full rounded-full" disabled>
                    Coming soon
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </PageShell>
    </div>
  );
}

export default Admin;
