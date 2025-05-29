import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase/config';

type LogEntry = {
  id: string;
  performedBy: string; // Admin email who performed the action
  targetUser: string;  // Target user's email
  action: string;
  timestamp: string;   // ISO string timestamp from Postgres
};

const LogPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from<LogEntry>('logs')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        if (!data) {
          setLogs([]);
          return;
        }

        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        setError('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-gray-100 text-left text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target User</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr
                      key={log.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">{log.performedBy}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.targetUser}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPage;
