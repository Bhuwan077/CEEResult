import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import ResultCard from '../components/ResultCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ResultDetail() {
  const { symbolNumber } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      if (!symbolNumber) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.searchResult(symbolNumber);
        if (response.found) {
          setResults(response.results);
        } else {
          setError(response.message || `No result found for symbol number '${symbolNumber}'.`);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve result.');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [symbolNumber]);

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Result Search</span>
        </Link>
      </div>

      {loading && (
        <div className="py-16">
          <LoadingSpinner size="lg" text={`Loading result for symbol ${symbolNumber}...`} />
        </div>
      )}

      {!loading && error && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Result Not Found</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-6">
          {results.map((res) => (
            <ResultCard key={res.id || res.symbol_number} result={res} />
          ))}
        </div>
      )}
    </div>
  );
}
