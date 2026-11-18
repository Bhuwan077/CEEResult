import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useSearch() {
  const [symbolNumber, setSymbolNumber] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (symbolOverride = null, examOverride = null) => {
    const symbolToSearch = (symbolOverride !== null ? symbolOverride : symbolNumber).trim();
    const examToFilter = examOverride !== null ? examOverride : selectedExamId;

    if (!symbolToSearch) {
      setError('Please enter your CEE symbol number to check results.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.searchResult(symbolToSearch, examToFilter || null);
      if (response.found) {
        setResults(response.results);
      } else {
        setResults([]);
        setError(response.message || `No result found for symbol number '${symbolToSearch}'.`);
      }
    } catch (err) {
      setResults([]);
      setError(err.message || 'Failed to fetch examination results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [symbolNumber, selectedExamId]);

  const clearSearch = useCallback(() => {
    setSymbolNumber('');
    setResults(null);
    setError(null);
    setHasSearched(false);
  }, []);

  return {
    symbolNumber,
    setSymbolNumber,
    selectedExamId,
    setSelectedExamId,
    results,
    loading,
    error,
    hasSearched,
    performSearch,
    clearSearch,
  };
}
