import React, { useState } from 'react';

const Schemes: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/ask`, {   // Flask backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer("⚠ Error fetching response. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-indigo-600">Government Schemes</h1>
      <p className="mb-4 text-gray-700">
        Find government support programs and legal resources for women.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about schemes (e.g. free education for girls)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleAsk}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Ask
        </button>
      </div>

      {loading && <p className="text-gray-500">⏳ Fetching answer...</p>}

      {answer && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-gray-800 whitespace-pre-line">
          {answer}
        </div>
      )}
    </div>
  );
};

export default Schemes;