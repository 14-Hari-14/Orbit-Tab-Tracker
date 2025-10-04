import { useState, useEffect } from 'react';
import { supabase } from './components/supabaseClient';
import Graph from './components/Graph';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("auth");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Always render Graph, passing session as a prop.
  // The Graph component will decide how to behave based on this.
  return <Graph session={session} />;
}