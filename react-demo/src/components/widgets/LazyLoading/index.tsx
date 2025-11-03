import { lazy, Suspense } from 'react';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false });

const lazyLoading = (importFunc: any) => {
  const LazyComp = lazy(async () => {
    NProgress.start();
    const module = await importFunc();
    NProgress.done();
    return module;
  });

  return function LazyComponent(props: any) {
    return (
      <Suspense fallback={null}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
};

export default lazyLoading;
