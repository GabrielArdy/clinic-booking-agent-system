import { useRoute } from './lib/router';
import PublicApp from './pages/PublicApp';
import AdminApp from './pages/admin/AdminApp';

export default function App() {
  const route = useRoute();
  return route.startsWith('/admin') ? <AdminApp /> : <PublicApp />;
}
