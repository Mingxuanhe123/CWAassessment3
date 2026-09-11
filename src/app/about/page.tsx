export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-6">About This Project</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">What is this?</h3>
        <p className="text-gray-600 mb-4">
          The Phoneme Activity Builder is a full-stack web application that lets Speech Pathology
          teachers create, manage, and deploy phoneme-based classroom activities. It extends
          Assessment 1 with a backend database, REST API, and Docker containerisation.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
          <li><strong>Phoneme Wordle</strong> — guessing game with phoneme symbols, hover hints show the letter equivalents.</li>
          <li><strong>Phoneme Word Search</strong> — find phoneme words hidden in a grid.</li>
          <li><strong>Word List Management</strong> — CRUD operations on word lists and individual words via API.</li>
          <li><strong>Activity Configuration</strong> — save and load activity settings from the database.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Tech Stack</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
          <li><strong>Framework:</strong> Next.js 16 (App Router, standalone output)</li>
          <li><strong>Frontend:</strong> React 19, Tailwind CSS 4, TypeScript</li>
          <li><strong>Backend:</strong> Next.js API Routes (REST API)</li>
          <li><strong>Database:</strong> SQLite via Prisma ORM</li>
          <li><strong>Containerisation:</strong> Docker</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">API Endpoints</h3>
        <div className="bg-gray-50 p-4 rounded-lg border text-sm font-mono space-y-1">
          <p>GET  /api/health — Health check (returns 200)</p>
          <p>GET  /api/word-lists — List all word lists</p>
          <p>POST /api/word-lists — Create word list</p>
          <p>GET  /api/word-lists/[id] — Get word list + words</p>
          <p>PUT  /api/word-lists/[id] — Update word list</p>
          <p>DELETE /api/word-lists/[id] — Delete word list</p>
          <p>POST /api/word-lists/[id]/words — Add word</p>
          <p>DELETE /api/word-lists/[id]/words?wordId=x — Remove word</p>
          <p>GET  /api/activities — List all activities</p>
          <p>POST /api/activities — Create activity</p>
          <p>GET  /api/activities/[id] — Get activity + words</p>
          <p>PUT  /api/activities/[id] — Update activity</p>
          <p>DELETE /api/activities/[id] — Delete activity</p>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">How to Run</h3>
        <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
          <li>Clone the repository</li>
          <li>Run <code className="bg-gray-200 px-1 rounded text-sm">npm install</code></li>
          <li>Run <code className="bg-gray-200 px-1 rounded text-sm">npm run db:push</code> to create the database</li>
          <li>Run <code className="bg-gray-200 px-1 rounded text-sm">npm run db:seed</code> to seed sample data</li>
          <li>Run <code className="bg-gray-200 px-1 rounded text-sm">npm run dev</code> to start the dev server</li>
          <li>Or build and run with Docker: <code className="bg-gray-200 px-1 rounded text-sm">docker build -t phoneme-builder . &amp;&amp; docker run -p 3000:3000 phoneme-builder</code></li>
        </ol>
      </section>

      <section className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-3">Student Info</h3>
        <p className="text-gray-600"><strong>Name:</strong> Mingxuan He</p>
        <p className="text-gray-600"><strong>Student ID:</strong> 19884912</p>
      </section>
    </div>
  );
}
