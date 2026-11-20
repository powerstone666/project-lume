function Footer() {
  return (
    <footer className="px-4 pb-28 pt-6 text-sm text-on-surface-variant md:px-12 md:pb-12">
      <div className="mx-auto max-w-5xl space-y-3 border-t border-outline-variant pt-6">
        <p className="text-2xl font-black uppercase tracking-tight text-primary">Lume</p>
        <p>
          Educational portfolio project. Lume does not host or support pirated content. All
          metadata comes from the TMDB API and playback is embedded from VidLink for
          demonstration purposes only.
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} Lume</span>
          <span>Built with React and Vite</span>
          <span>
            Data from{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface underline underline-offset-2 hover:text-primary"
            >
              TMDB
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
