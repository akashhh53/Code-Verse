import { ArrowRight, Edit, Home, Library, Plus, ShieldCheck, Trash2, Video } from 'lucide-react';
import { NavLink } from 'react-router';

const adminOptions = [
  {
    id: 'create',
    title: 'Create Problem',
    description: 'Build a new challenge with statements, test cases, starter code, and reference solutions.',
    icon: Plus,
    color: 'btn-success',
    tone: 'border-success/20 bg-success/10 text-success',
    route: '/admin/create',
    meta: 'Problem builder',
  },
  {
    id: 'update',
    title: 'Update Problem',
    description: 'Edit existing problem details when the update workflow is connected.',
    icon: Edit,
    color: 'btn-warning',
    tone: 'border-warning/20 bg-warning/10 text-warning',
    route: null,
    meta: 'Coming soon',
  },
  {
    id: 'delete',
    title: 'Delete Problem',
    description: 'Review the problem list and remove outdated or incorrect challenges.',
    icon: Trash2,
    color: 'btn-error',
    tone: 'border-error/20 bg-error/10 text-error',
    route: '/admin/delete',
    meta: 'Careful action',
  },
  {
    id: 'video',
    title: 'Video Library',
    description: 'Upload and manage editorial videos linked to individual problems.',
    icon: Video,
    color: 'btn-info',
    tone: 'border-info/20 bg-info/10 text-info',
    route: '/admin/video',
    meta: 'Learning content',
  },
];

function Admin() {
  const liveTools = adminOptions.filter((option) => option.route).length;

  return (
    <div className="min-h-screen bg-base-200">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <NavLink to="/" className="btn btn-ghost gap-2">
            <Home className="h-4 w-4" />
            Home
          </NavLink>
          <div className="badge badge-primary badge-outline gap-2 px-3 py-3">
            <ShieldCheck className="h-4 w-4" />
            Admin only
          </div>
        </nav>

        <section className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Library className="h-4 w-4" />
                Platform control center
              </div>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Workspace
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-base-content/70">
                Manage your problem catalog, keep content fresh, and guide learners with clean editorials.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[28rem]">
              <AdminStat label="Tools" value={adminOptions.length} />
              <AdminStat label="Live" value={liveTools} />
              <AdminStat label="Queued" value={adminOptions.length - liveTools} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;

            return (
              <article
                key={option.id}
                className="flex min-h-72 flex-col rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${option.tone}`}>
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="mt-5 flex-1">
                  <div className="mb-3 badge badge-outline">{option.meta}</div>
                  <h2 className="text-xl font-bold">{option.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-base-content/70">
                    {option.description}
                  </p>
                </div>

                {option.route ? (
                  <NavLink to={option.route} className={`btn ${option.color} btn-sm mt-6 w-full gap-2`}>
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </NavLink>
                ) : (
                  <button type="button" className="btn btn-disabled btn-sm mt-6 w-full" disabled>
                    Coming soon
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function AdminStat({ label, value }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default Admin;
