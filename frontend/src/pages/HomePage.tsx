export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-700 to-indigo-800 text-white">
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">QuantumChat</h1>
        <p className="mt-4 text-indigo-100 text-lg md:text-xl">Experience the future of secure messaging with quantum key distribution</p>
        <div className="mt-4 text-indigo-200 text-sm">BB84 Protocol • AES-256 Encryption • Educational Simulation</div>
        <a href="/login" className="inline-block mt-8 bg-white text-indigo-700 px-6 py-3 rounded font-semibold shadow hover:shadow-md">Get Started</a>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow text-gray-900">
          <div className="text-lg font-semibold">Quantum Key Distribution</div>
          <p className="mt-2 text-sm text-gray-600">Simulate BB84 protocol for secure key exchange using quantum mechanics principles.</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-gray-900">
          <div className="text-lg font-semibold">Secure Messaging</div>
          <p className="mt-2 text-sm text-gray-600">Real‑time chat with messages encrypted using quantum‑derived AES keys.</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-gray-900">
          <div className="text-lg font-semibold">Interactive Learning</div>
          <p className="mt-2 text-sm text-gray-600">Step‑by‑step visualization of quantum cryptography concepts.</p>
        </div>
      </main>
    </div>
  );
}


