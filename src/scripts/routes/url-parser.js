function extractPathnameSegments(path) {
  const splitUrl = path.split('/');

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = '';

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat('/:id');
  }

  return pathname || '/';
}

export function getActivePathname() {
  return location.hash.replace('#', '') || '/';
}

export function getActiveRoute() {
  const hash = window.location.hash.slice(1).toLowerCase() || '/';
  // Only allow known routes
  if (hash === '' || hash === '/') return '/';
  return hash;
}

export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}

const UrlParser = {
  parseActiveUrlWithoutCombiner() {
    const hash = window.location.hash.slice(1).toLowerCase() || '/';
    return hash.split('/')[1] ? `/${hash.split('/')[1]}` : '/';
  }
};

export default UrlParser;
