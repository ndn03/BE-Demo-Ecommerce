import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { Link, useLocation, matchRoutes } from 'react-router-dom';
import routeConfig from '@route/routeConfig';
import { HomeOutlined } from '@ant-design/icons';

function Breadcrumb() {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i) => i);

  // Create breadcrumb items from path
  const breadcrumbItem = pathSnippets.map((path, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const routes = routeConfig.map((r) => ({
      path: r.path,
      element: r.Element,
    }));

    try {
      const checkRoute = matchRoutes(routes, url);
      const isLastItem = index === pathSnippets.length - 1;

      // Capitalize and format path name
      const displayName =
        path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');

      return {
        title:
          checkRoute && !isLastItem ? (
            <Link to={url}>{displayName}</Link>
          ) : (
            displayName
          ),
        key: url,
      };
    } catch (error) {
      console.warn('Breadcrumb routing error:', error);
      return {
        title: path.charAt(0).toUpperCase() + path.slice(1),
        key: url,
      };
    }
  });

  // Add home breadcrumb
  const breadcrumbItems = [
    {
      title: (
        <Link to="/">
          <HomeOutlined /> Dashboard
        </Link>
      ),
      key: 'home',
    },
    ...breadcrumbItem,
  ];

  return <BreadcrumbAntd items={breadcrumbItems} />;
}

export default Breadcrumb;
