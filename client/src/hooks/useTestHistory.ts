import { useEffect, useState } from 'react';
import { AnyTestResult } from '@/lib/types';
import { getAllTestResults, getTestResultsByType } from '@/lib/db';

export function useTestHistory() {
  const [allTests, setAllTests] = useState<AnyTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAllTests();
  }, []);

  const loadAllTests = async () => {
    try {
      setLoading(true);
      const results = await getAllTestResults();
      setAllTests(results.sort((a, b) => b.timestamp - a.timestamp));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tests'));
    } finally {
      setLoading(false);
    }
  };

  const getTestsByType = async (type: 'vision' | 'hearing' | 'cognition' | 'coordination') => {
    try {
      const results = await getTestResultsByType(type);
      return results.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to get tests by type:', err);
      return [];
    }
  };

  const getLatestTest = (type: 'vision' | 'hearing' | 'cognition' | 'coordination') => {
    return allTests.find((t) => t.type === type);
  };

  const getTestsInDateRange = (type: 'vision' | 'hearing' | 'cognition' | 'coordination', days: number) => {
    const now = Date.now();
    const rangeMs = days * 24 * 60 * 60 * 1000;
    return allTests.filter((t) => t.type === type && now - t.timestamp <= rangeMs);
  };

  return {
    allTests,
    loading,
    error,
    refresh: loadAllTests,
    loadAllTests,
    getTestsByType,
    getLatestTest,
    getTestsInDateRange,
  };
}
