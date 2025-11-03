import { useEffect } from 'react';

function HeadHtml({ title = 'home', url = window.location.href }) {
  const siteName = 'React App';
  const fullTitle = `${title} | ${siteName}`;
  const description = 'React application with login functionality';

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update viewport meta if not exists
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(meta);
    }
  }, [fullTitle, description]);

  return null; // This component doesn't render anything
}

export default HeadHtml;
