import { AppShell } from "./components/layout/AppShell.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MainRouter } from "./router/MainRouter.jsx";

function AppContent() {
  const { session, isHydrating } = useAuth();

  if (isHydrating) {
    return <div className="screen-message">세션을 확인하고 있어.</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <MainRouter />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
