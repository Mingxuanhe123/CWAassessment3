import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Welcome to the Phoneme Activity Builder</h2>
        <p className="text-lg text-gray-600 mb-6">
          A full-stack tool for Speech Pathology teachers to create, manage, and deploy phoneme-based classroom activities.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/wordle" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Create Wordle
          </Link>
          <Link href="/word-search" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
            Create Word Search
          </Link>
          <Link href="/word-lists" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Manage Word Lists
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-3">🎮 Phoneme Wordle</h3>
          <p className="text-gray-600">
            Wordle-style guessing game using phoneme symbols instead of spelling.
            Students guess the phoneme sequence with hover hints showing letter equivalents.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-3">🔤 Word Search</h3>
          <p className="text-gray-600">
            Generate a phoneme-based word search puzzle. Students find hidden phoneme
            sequences in a grid — good for practising phoneme recognition.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-3">💾 Database Backend</h3>
          <p className="text-gray-600">
            All word lists and activity configurations are stored in a database via Prisma ORM.
            Create, read, update, and delete through the API or UI.
          </p>
        </div>
      </section>

      <section className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
        <h3 className="text-xl font-semibold mb-3">Architecture</h3>
        <ul className="text-gray-600 space-y-2">
          <li><strong>Frontend:</strong> Next.js 16 + React 19 + Tailwind CSS 4</li>
          <li><strong>Backend:</strong> Next.js API Routes (REST)</li>
          <li><strong>Database:</strong> SQLite via Prisma ORM</li>
          <li><strong>Containerisation:</strong> Docker (standalone output)</li>
        </ul>
      </section>

      <section className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold mb-3">Health Check</h3>
        <p className="text-gray-600">
          API health endpoint: <code className="bg-gray-200 px-2 py-1 rounded text-sm">GET /api/health</code>
        </p>
      </section>
    </div>
  );
}
