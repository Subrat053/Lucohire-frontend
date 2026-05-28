import { Helmet } from 'react-helmet-async';

const defaultTitle = 'Lucohire';
const defaultDescription = 'AI-powered hiring platform for verified service providers and recruiters.';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
};

const resolveCanonical = (canonicalPath) => {
  if (!canonicalPath) return '';
  if (canonicalPath.startsWith('http://') || canonicalPath.startsWith('https://')) return canonicalPath;
  const base = resolveBaseUrl();
  if (!base) return canonicalPath;
  return `${base}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
};

const Seo = ({
  title,
  description,
  canonicalPath,
  image,
  robots = 'index, follow',
  schema,
}) => {
  const resolvedTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const canonical = resolveCanonical(canonicalPath);
  const resolvedImage = image ? resolveCanonical(image) : '';

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      {canonical && <meta property="og:url" content={canonical} />}
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}

      <meta name="twitter:card" content={resolvedImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default Seo;
