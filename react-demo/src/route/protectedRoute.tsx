import { useEffect, ReactNode } from 'react';
import { checkAuth } from '@libs/localStorage';
import { useNavigate } from 'react-router-dom';
import Forbidden from '@components/screens/403';
import Error from '@components/screens/500';
import { ERole } from '@configs/interface.config';
import { useQueryProfile } from '@queries/hooks/auth';
// import useSocket from '@src/hooks/useSocket'

function ProtectedRoute({
  keyName,
  children,
}: {
  keyName: ERole[];
  children: ReactNode;
}) {
  const token: string = checkAuth();
  const { data, isLoading, error } = useQueryProfile();
  // useSocket()
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate('/login');
  }, [navigate, token]);

  if (keyName?.length === 0) return children;
  if (error) return <Error />;
  if (isLoading || !data) return null;
  if (!keyName.includes(data.role)) return <Forbidden />;
  return children;
}

export default ProtectedRoute;
