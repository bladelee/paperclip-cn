import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Layout } from "./components/Layout";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { CloudAccessGate } from "./components/CloudAccessGate";
import { useCompany } from "./context/CompanyContext";
import { useDialogActions } from "./context/DialogContext";
import { loadLastInboxTab } from "./lib/inbox";
import { shouldRedirectCompanylessRouteToOnboarding } from "./lib/onboarding-route";
import { PageSkeleton } from "./components/PageSkeleton";

// ── Eager imports: needed on every page (layout, auth, shell) ──────────

// ── Lazy imports: loaded on demand ─────────────────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const DashboardLive = lazy(() => import("./pages/DashboardLive").then(m => ({ default: m.DashboardLive })));
const Companies = lazy(() => import("./pages/Companies").then(m => ({ default: m.Companies })));
const Agents = lazy(() => import("./pages/Agents").then(m => ({ default: m.Agents })));
const AgentDetail = lazy(() => import("./pages/AgentDetail").then(m => ({ default: m.AgentDetail })));
const Projects = lazy(() => import("./pages/Projects").then(m => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail").then(m => ({ default: m.ProjectDetail })));
const ProjectWorkspaceDetail = lazy(() => import("./pages/ProjectWorkspaceDetail").then(m => ({ default: m.ProjectWorkspaceDetail })));
const Workspaces = lazy(() => import("./pages/Workspaces").then(m => ({ default: m.Workspaces })));
const Issues = lazy(() => import("./pages/Issues").then(m => ({ default: m.Issues })));
const Search = lazy(() => import("./pages/Search").then(m => ({ default: m.Search })));
const IssueDetail = lazy(() => import("./pages/IssueDetail").then(m => ({ default: m.IssueDetail })));
const IssueChatLongThreadPerf = lazy(() => import("./pages/IssueChatLongThreadPerf").then(m => ({ default: m.IssueChatLongThreadPerf })));
const Routines = lazy(() => import("./pages/Routines").then(m => ({ default: m.Routines })));
const RoutineDetail = lazy(() => import("./pages/RoutineDetail").then(m => ({ default: m.RoutineDetail })));
const UserProfile = lazy(() => import("./pages/UserProfile").then(m => ({ default: m.UserProfile })));
const ExecutionWorkspaceDetail = lazy(() => import("./pages/ExecutionWorkspaceDetail").then(m => ({ default: m.ExecutionWorkspaceDetail })));
const Goals = lazy(() => import("./pages/Goals").then(m => ({ default: m.Goals })));
const GoalDetail = lazy(() => import("./pages/GoalDetail").then(m => ({ default: m.GoalDetail })));
const Approvals = lazy(() => import("./pages/Approvals").then(m => ({ default: m.Approvals })));
const ApprovalDetail = lazy(() => import("./pages/ApprovalDetail").then(m => ({ default: m.ApprovalDetail })));
const Costs = lazy(() => import("./pages/Costs").then(m => ({ default: m.Costs })));
const Activity = lazy(() => import("./pages/Activity").then(m => ({ default: m.Activity })));
const Inbox = lazy(() => import("./pages/Inbox").then(m => ({ default: m.Inbox })));
const CompanySettings = lazy(() => import("./pages/CompanySettings").then(m => ({ default: m.CompanySettings })));
const CompanyEnvironments = lazy(() => import("./pages/CompanyEnvironments").then(m => ({ default: m.CompanyEnvironments })));
const CompanyAccess = lazy(() => import("./pages/CompanyAccess").then(m => ({ default: m.CompanyAccess })));
const CompanyInvites = lazy(() => import("./pages/CompanyInvites").then(m => ({ default: m.CompanyInvites })));
const CompanySkills = lazy(() => import("./pages/CompanySkills").then(m => ({ default: m.CompanySkills })));
const Secrets = lazy(() => import("./pages/Secrets").then(m => ({ default: m.Secrets })));
const CompanyExport = lazy(() => import("./pages/CompanyExport").then(m => ({ default: m.CompanyExport })));
const CompanyImport = lazy(() => import("./pages/CompanyImport").then(m => ({ default: m.CompanyImport })));
const DesignGuide = lazy(() => import("./pages/DesignGuide").then(m => ({ default: m.DesignGuide })));
const InstanceGeneralSettings = lazy(() => import("./pages/InstanceGeneralSettings").then(m => ({ default: m.InstanceGeneralSettings })));
const InstanceAccess = lazy(() => import("./pages/InstanceAccess").then(m => ({ default: m.InstanceAccess })));
const InstanceSettings = lazy(() => import("./pages/InstanceSettings").then(m => ({ default: m.InstanceSettings })));
const InstanceExperimentalSettings = lazy(() => import("./pages/InstanceExperimentalSettings").then(m => ({ default: m.InstanceExperimentalSettings })));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings").then(m => ({ default: m.ProfileSettings })));
const PluginManager = lazy(() => import("./pages/PluginManager").then(m => ({ default: m.PluginManager })));
const PluginSettings = lazy(() => import("./pages/PluginSettings").then(m => ({ default: m.PluginSettings })));
const AdapterManager = lazy(() => import("./pages/AdapterManager").then(m => ({ default: m.AdapterManager })));
const PluginPage = lazy(() => import("./pages/PluginPage").then(m => ({ default: m.PluginPage })));
const OrgChart = lazy(() => import("./pages/OrgChart").then(m => ({ default: m.OrgChart })));
const NewAgent = lazy(() => import("./pages/NewAgent").then(m => ({ default: m.NewAgent })));
const AuthPage = lazy(() => import("./pages/Auth").then(m => ({ default: m.AuthPage })));
const BoardClaimPage = lazy(() => import("./pages/BoardClaim").then(m => ({ default: m.BoardClaimPage })));
const CliAuthPage = lazy(() => import("./pages/CliAuth").then(m => ({ default: m.CliAuthPage })));
const InviteLandingPage = lazy(() => import("./pages/InviteLanding").then(m => ({ default: m.InviteLandingPage })));
const JoinRequestQueue = lazy(() => import("./pages/JoinRequestQueue").then(m => ({ default: m.JoinRequestQueue })));
const NotFoundPage = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFoundPage })));

/** Minimal page-level suspense fallback */
function PageLoader() {
  return <PageSkeleton />;
}

function LazyPage({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function boardRoutes() {
  return (
    <>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LazyPage component={Dashboard} />} />
      <Route path="dashboard/live" element={<LazyPage component={DashboardLive} />} />
      <Route path="onboarding" element={<OnboardingRoutePage />} />
      <Route path="companies" element={<LazyPage component={Companies} />} />
      <Route path="company/settings" element={<LazyPage component={CompanySettings} />} />
      <Route path="company/settings/environments" element={<LazyPage component={CompanyEnvironments} />} />
      <Route path="company/settings/access" element={<LazyPage component={CompanyAccess} />} />
      <Route path="company/settings/invites" element={<LazyPage component={CompanyInvites} />} />
      <Route path="company/export/*" element={<LazyPage component={CompanyExport} />} />
      <Route path="company/import" element={<LazyPage component={CompanyImport} />} />
      <Route path="company/settings/secrets" element={<LazyPage component={Secrets} />} />
      <Route path="skills/*" element={<LazyPage component={CompanySkills} />} />
      <Route path="settings" element={<LegacySettingsRedirect />} />
      <Route path="settings/*" element={<LegacySettingsRedirect />} />
      <Route path="plugins/:pluginId" element={<LazyPage component={PluginPage} />} />
      <Route path="org" element={<LazyPage component={OrgChart} />} />
      <Route path="agents" element={<Navigate to="/agents/all" replace />} />
      <Route path="agents/all" element={<LazyPage component={Agents} />} />
      <Route path="agents/active" element={<LazyPage component={Agents} />} />
      <Route path="agents/paused" element={<LazyPage component={Agents} />} />
      <Route path="agents/error" element={<LazyPage component={Agents} />} />
      <Route path="agents/new" element={<LazyPage component={NewAgent} />} />
      <Route path="agents/:agentId" element={<LazyPage component={AgentDetail} />} />
      <Route path="agents/:agentId/:tab" element={<LazyPage component={AgentDetail} />} />
      <Route path="agents/:agentId/runs/:runId" element={<LazyPage component={AgentDetail} />} />
      <Route path="projects" element={<LazyPage component={Projects} />} />
      <Route path="projects/:projectId" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/overview" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/issues" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/issues/:filter" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/workspaces/:workspaceId" element={<LazyPage component={ProjectWorkspaceDetail} />} />
      <Route path="projects/:projectId/workspaces" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/configuration" element={<LazyPage component={ProjectDetail} />} />
      <Route path="projects/:projectId/budget" element={<LazyPage component={ProjectDetail} />} />
      <Route path="workspaces" element={<LazyPage component={Workspaces} />} />
      <Route path="issues" element={<LazyPage component={Issues} />} />
      <Route path="search" element={<LazyPage component={Search} />} />
      <Route path="issues/all" element={<Navigate to="/issues" replace />} />
      <Route path="issues/active" element={<Navigate to="/issues" replace />} />
      <Route path="issues/backlog" element={<Navigate to="/issues" replace />} />
      <Route path="issues/done" element={<Navigate to="/issues" replace />} />
      <Route path="issues/recent" element={<Navigate to="/issues" replace />} />
      <Route path="issues/:issueId" element={<LazyPage component={IssueDetail} />} />
      {import.meta.env.DEV ? (
        <Route path="tests/perf/long-thread" element={<LazyPage component={IssueChatLongThreadPerf} />} />
      ) : null}
      <Route path="routines" element={<LazyPage component={Routines} />} />
      <Route path="routines/:routineId" element={<LazyPage component={RoutineDetail} />} />
      <Route path="execution-workspaces/:workspaceId" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="execution-workspaces/:workspaceId/services" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="execution-workspaces/:workspaceId/configuration" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="execution-workspaces/:workspaceId/runtime-logs" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="execution-workspaces/:workspaceId/issues" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="execution-workspaces/:workspaceId/routines" element={<LazyPage component={ExecutionWorkspaceDetail} />} />
      <Route path="goals" element={<LazyPage component={Goals} />} />
      <Route path="goals/:goalId" element={<LazyPage component={GoalDetail} />} />
      <Route path="approvals" element={<Navigate to="/approvals/pending" replace />} />
      <Route path="approvals/pending" element={<LazyPage component={Approvals} />} />
      <Route path="approvals/all" element={<LazyPage component={Approvals} />} />
      <Route path="approvals/:approvalId" element={<LazyPage component={ApprovalDetail} />} />
      <Route path="costs" element={<LazyPage component={Costs} />} />
      <Route path="activity" element={<LazyPage component={Activity} />} />
      <Route path="inbox" element={<InboxRootRedirect />} />
      <Route path="inbox/mine" element={<LazyPage component={Inbox} />} />
      <Route path="inbox/recent" element={<LazyPage component={Inbox} />} />
      <Route path="inbox/unread" element={<LazyPage component={Inbox} />} />
      <Route path="inbox/blocked" element={<LazyPage component={Inbox} />} />
      <Route path="inbox/all" element={<LazyPage component={Inbox} />} />
      <Route path="inbox/requests" element={<LazyPage component={JoinRequestQueue} />} />
      <Route path="inbox/new" element={<Navigate to="/inbox/mine" replace />} />
      <Route path="u/:userSlug" element={<LazyPage component={UserProfile} />} />
      <Route path="design-guide" element={<LazyPage component={DesignGuide} />} />
      <Route path="instance/settings/adapters" element={<LazyPage component={AdapterManager} />} />
      <Route path=":pluginRoutePath/*" element={<LazyPage component={PluginPage} />} />
      <Route path="*" element={<LazyPage component={NotFoundPage} />} />
    </>
  );
}

function InboxRootRedirect() {
  return <Navigate to={`/inbox/${loadLastInboxTab()}`} replace />;
}

function LegacySettingsRedirect() {
  const location = useLocation();
  return <Navigate to={`/instance/settings/general${location.search}${location.hash}`} replace />;
}

function OnboardingRoutePage() {
  const { companies } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const matchedCompany = companyPrefix
    ? companies.find((company) => company.issuePrefix.toUpperCase() === companyPrefix.toUpperCase()) ?? null
    : null;

  const title = matchedCompany
    ? `Add another agent to ${matchedCompany.name}`
    : companies.length > 0
      ? "Create another company"
      : "Create your first company";
  const description = matchedCompany
    ? "Run onboarding again to add an agent and a starter task for this company."
    : companies.length > 0
      ? "Run onboarding again to create another company and seed its first agent."
      : "Get started by creating a company and your first agent.";

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4">
          <Button
            onClick={() =>
              matchedCompany
                ? openOnboarding({ initialStep: 2, companyId: matchedCompany.id })
                : openOnboarding()
            }
          >
            {matchedCompany ? "Add Agent" : "Start Onboarding"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompanyRootRedirect() {
  const { companies, selectedCompany, loading } = useCompany();
  const location = useLocation();

  if (loading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  const targetCompany = selectedCompany ?? companies[0] ?? null;
  if (!targetCompany) {
    if (
      shouldRedirectCompanylessRouteToOnboarding({
        pathname: location.pathname,
        hasCompanies: false,
      })
    ) {
      return <Navigate to="/onboarding" replace />;
    }
    return <NoCompaniesStartPage />;
  }

  return <Navigate to={`/${targetCompany.issuePrefix}/dashboard`} replace />;
}

function UnprefixedBoardRedirect() {
  const location = useLocation();
  const { companies, selectedCompany, loading } = useCompany();

  if (loading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  const targetCompany = selectedCompany ?? companies[0] ?? null;
  if (!targetCompany) {
    if (
      shouldRedirectCompanylessRouteToOnboarding({
        pathname: location.pathname,
        hasCompanies: false,
      })
    ) {
      return <Navigate to="/onboarding" replace />;
    }
    return <NoCompaniesStartPage />;
  }

  return (
    <Navigate
      to={`/${targetCompany.issuePrefix}${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}

function NoCompaniesStartPage() {
  const { openOnboarding } = useDialogActions();

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Create your first company</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating a company.
        </p>
        <div className="mt-4">
          <Button onClick={() => openOnboarding()}>New Company</Button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="auth" element={<LazyPage component={AuthPage} />} />
          <Route path="board-claim/:token" element={<LazyPage component={BoardClaimPage} />} />
          <Route path="cli-auth/:id" element={<LazyPage component={CliAuthPage} />} />
          <Route path="invite/:token" element={<LazyPage component={InviteLandingPage} />} />
          <Route path="tests/perf/long-thread" element={<LazyPage component={IssueChatLongThreadPerf} />} />

          <Route element={<CloudAccessGate />}>
            <Route index element={<CompanyRootRedirect />} />
            <Route path="onboarding" element={<OnboardingRoutePage />} />
            <Route path="instance" element={<Navigate to="/instance/settings/general" replace />} />
            <Route path="instance/settings" element={<Layout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="profile" element={<LazyPage component={ProfileSettings} />} />
              <Route path="general" element={<LazyPage component={InstanceGeneralSettings} />} />
              <Route path="access" element={<LazyPage component={InstanceAccess} />} />
              <Route path="heartbeats" element={<LazyPage component={InstanceSettings} />} />
              <Route path="experimental" element={<LazyPage component={InstanceExperimentalSettings} />} />
              <Route path="plugins" element={<LazyPage component={PluginManager} />} />
              <Route path="plugins/:pluginId" element={<LazyPage component={PluginSettings} />} />
              <Route path="adapters" element={<LazyPage component={AdapterManager} />} />
            </Route>
            <Route path="companies" element={<UnprefixedBoardRedirect />} />
            <Route path="issues" element={<UnprefixedBoardRedirect />} />
            <Route path="issues/:issueId" element={<UnprefixedBoardRedirect />} />
            <Route path="routines" element={<UnprefixedBoardRedirect />} />
            <Route path="routines/:routineId" element={<UnprefixedBoardRedirect />} />
            <Route path="u/:userSlug" element={<UnprefixedBoardRedirect />} />
            <Route path="skills/*" element={<UnprefixedBoardRedirect />} />
            <Route path="settings" element={<LegacySettingsRedirect />} />
            <Route path="settings/*" element={<LegacySettingsRedirect />} />
            <Route path="agents" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/new" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId/:tab" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId/runs/:runId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/overview" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/issues" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/issues/:filter" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/workspaces" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/workspaces/:workspaceId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/configuration" element={<UnprefixedBoardRedirect />} />
            <Route path="workspaces" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/services" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/configuration" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/runtime-logs" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/issues" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/routines" element={<UnprefixedBoardRedirect />} />
            <Route path=":companyPrefix" element={<Layout />}>
              {boardRoutes()}
            </Route>
            <Route path="*" element={<LazyPage component={NotFoundPage} />} />
          </Route>
        </Routes>
      </Suspense>
      <OnboardingWizard />
    </>
  );
}
