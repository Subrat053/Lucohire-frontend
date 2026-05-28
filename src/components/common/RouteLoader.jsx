import LoadingSpinner from './LoadingSpinner';

const RouteLoader = ({ label = 'Loading...' }) => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text={label} />
  </div>
);

export default RouteLoader;
