import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-5xl">🎬</span>
                        Media Editor
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Professional media editing tools for videos, images, and GIFs
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Video Editor Card */}
                    <Link href="/video-editor">
                        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer p-8 h-full">
                            <div className="text-5xl mb-4">🎥</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Video Editor
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Edit video properties including:
                            </p>
                            <ul className="text-gray-700 space-y-2 mb-4">
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Video Bitrate
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Audio Bitrate
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Orientation
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Resolution & Format
                                </li>
                            </ul>
                            <div className="text-primary font-semibold">Get Started →</div>
                        </div>
                    </Link>

                    {/* Image Editor Card */}
                    <Link href="/image-editor">
                        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer p-8 h-full">
                            <div className="text-5xl mb-4">🖼️</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Image Editor
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Enhance and convert your images:
                            </p>
                            <ul className="text-gray-700 space-y-2 mb-4">
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Resize & Crop
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Compression
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Format Conversion
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Rotation
                                </li>
                            </ul>
                            <div className="text-primary font-semibold">Get Started →</div>
                        </div>
                    </Link>

                    {/* GIF Editor Card */}
                    <Link href="/gif-editor">
                        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer p-8 h-full">
                            <div className="text-5xl mb-4">🎞️</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                GIF Editor
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Create and edit animated GIFs:
                            </p>
                            <ul className="text-gray-700 space-y-2 mb-4">
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Frame Control
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Speed Adjustment
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Size Optimization
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">✓</span> Video to GIF
                                </li>
                            </ul>
                            <div className="text-primary font-semibold">Get Started →</div>
                        </div>
                    </Link>
                </div>

                {/* Features Section */}
                <section className="mt-16 bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-4">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Fast Processing</h3>
                                <p className="text-gray-600">
                                    Quick and efficient media conversion
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">
                                    Privacy First
                                </h3>
                                <p className="text-gray-600">
                                    All processing happens locally in your browser
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-2xl">🎨</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">
                                    Easy to Use
                                </h3>
                                <p className="text-gray-600">
                                    Intuitive interface for all users
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-2xl">📦</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">
                                    Multiple Formats
                                </h3>
                                <p className="text-gray-600">
                                    Support for all popular media formats
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white mt-16 py-6">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p>&copy; 2024 Media Editor. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
