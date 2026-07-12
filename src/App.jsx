import { useRoute } from './lib/router';
import { useAuth } from './lib/auth';
import Toaster from './components/Toaster';
import PublicApp from './pages/PublicApp';
import Login from './pages/Login';
import AdminApp from './pages/admin/AdminApp';
import DoctorApp from './pages/doctor/DoctorApp';
import StaffApp from './pages/staff/StaffApp';

const CONSOLES = { '/admin': AdminApp, '/doctor': DoctorApp, '/staff': StaffApp };

function View({ route, auth }) {
  const entry = Object.keys(CONSOLES).find((p) => route === p || route.startsWith(`${p}/`));
  if (!entry) return <PublicApp />;              // public site
  if (!auth?.token) return <Login />;            // gate every console behind login
  const Console = CONSOLES[entry];
  return <Console auth={auth} />;
}

export default function App() {
  const route = useRoute();
  const auth = useAuth();
  return (
    <>
      <View route={route} auth={auth} />
      <Toaster />
    </>
  );
}
