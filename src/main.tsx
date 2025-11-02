// main.tsx (top of file, before React mounts)
if ('serviceWorker' in navigator && !localStorage.getItem('sw-cleaned')) {
  const expectedScope = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/';

  navigator.serviceWorker.getRegistrations().then(regs => {
    const promises = regs.map(reg => {
      // If scope doesn't start with our current base, nuke it
      if (!reg.scope.endsWith(expectedScope)) {
        return reg.unregister();
      }
      return Promise.resolve(false);
    });
    Promise.allSettled(promises).finally(() => {
      localStorage.setItem('sw-cleaned', '1');
    });
  });
}
