import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80">
                    <span className="text-2xl">🎬</span>
                    <span className="font-bold text-xl text-gray-900">Media Editor</span>
                </Link>
            </div>
        </header>
    );
}
