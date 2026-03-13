export default function Header() {
    return (
        <header className="relative z-50 bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <a
                    href="/"
                    className="relative z-[60] inline-flex items-center gap-2 hover:opacity-80"
                >
                    <span className="text-2xl">🎬</span>
                    <span className="font-bold text-xl text-gray-900">Media Editor</span>
                </a>
            </div>
        </header>
    );
}
