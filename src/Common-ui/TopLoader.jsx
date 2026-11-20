const TopLoader = () => (
  <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden">
    <div className="h-full w-full origin-left animate-top-progress bg-primary" />
  </div>
);

export default TopLoader;
