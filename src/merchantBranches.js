const storageKey = 'bippo-active-branch';
export const isBranchId = value => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value || '');

export function rememberBranch(id) {
  if (isBranchId(id)) sessionStorage.setItem(storageKey, id);
  else sessionStorage.removeItem(storageKey);
}

export function branchFetch(base) {
  return (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const screen = /^#dashboard\/(kitchen|customer-screen)$/.test(location.hash);
    const requested = screen ? new URLSearchParams(location.search).get('branch') : null;
    const branch = requested || sessionStorage.getItem(storageKey);
    if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/rest/v1/') || !isBranchId(branch)) {
      return fetch(input, init);
    }
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('x-client-info', 'bippo-branch/' + branch.toLowerCase());
    return fetch(input, { ...init, headers });
  };
}
