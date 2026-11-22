import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
        <span className="text-2xl font-bold text-blue-400">404</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-slate-400 max-w-md mb-8 text-sm">
        The banking page or transaction record you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/login"
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
      >
        Return to Portal
      </Link>
    </div>
  );
}
