import React from "react";
import Graph from "./components/Graph";
//import { AuthProvider } from "./services/AuthContext";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Orbit</h1>
        <Graph />
    </div>
  );
}

// import { Auth } from '@supabase/auth-ui-react'
// import {
//   // Import predefined theme
//   ThemeSupa,
// } from '@supabase/auth-ui-shared'

// const supabase = createClient(
//   process.env.VITE_SUPABASE_URL,
//   process.env.VITE_SUPABASE_ANON_KEY,
// )

// const App = () => (
//   <Auth
//     supabaseClient={supabase}
//     {/* Apply predefined theme */}
//     appearance={{ theme: ThemeSupa }}
//   />
// )
export default App;
