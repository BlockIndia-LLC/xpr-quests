export function Footer() {
  return (
    <footer className="bg-background-card border-t border-surface-border">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-500">
            Built on{" "}
            <span className="text-accent-cyan font-medium">XPR Network</span>
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://docs.xprnetwork.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-accent-purple transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/XPRNetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-accent-purple transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} XPR Quests. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
