import { supabase } from '../components/supabaseClient';

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

// Local Storage functions (for non-authenticated users)
export const saveToLocalStorage = (nodes, edges, collapsedIds) => {
  try {
    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });
    const plainCollapsed = Array.from(collapsedIds);
    const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges, collapsed: plainCollapsed });
    localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
    return { success: true };
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
    return { success: false, error };
  }
};

export const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData === null) return null;
    return JSON.parse(savedData);
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
};

// Supabase functions (for authenticated users)
export const saveToSupabase = async (nodes, edges, collapsedIds) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });

    // Transform nodes for Supabase
    const supabaseNodes = plainNodes.map(node => ({
      id: node.id,
      user_id: user.id,
      label: node.label || '',
      url: node.url || '',
      note: node.note || '',
      is_root: !plainEdges.some(edge => edge.to === node.id), // Root if no incoming edges
      is_parent: node.isParent || false,
      shape: node.shape || 'box',
      value: node.value || 25
    }));

    // Transform edges for Supabase
    const supabaseEdges = plainEdges.map(edge => ({
      user_id: user.id,
      from_node_id: edge.from,
      to_node_id: edge.to
    }));

    // Clear existing data for this user
    await supabase.from('edges').delete().eq('user_id', user.id);
    await supabase.from('nodes').delete().eq('user_id', user.id);

    // Insert new data
    const { error: nodesError } = await supabase.from('nodes').insert(supabaseNodes);
    if (nodesError) throw nodesError;

    if (supabaseEdges.length > 0) {
      const { error: edgesError } = await supabase.from('edges').insert(supabaseEdges);
      if (edgesError) throw edgesError;
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save to Supabase:", error);
    return { success: false, error };
  }
};

export const loadFromSupabase = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Load nodes
    const { data: nodesData, error: nodesError } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', user.id);
    
    if (nodesError) throw nodesError;

    // Load edges
    const { data: edgesData, error: edgesError } = await supabase
      .from('edges')
      .select('*')
      .eq('user_id', user.id);
    
    if (edgesError) throw edgesError;

    // Transform back to vis-network format
    const nodes = nodesData.map(node => ({
      id: node.id,
      label: node.label,
      url: node.url,
      note: node.note,
      isParent: node.is_parent,
      shape: node.shape,
      value: node.value
    }));

    const edges = edgesData.map(edge => ({
      from: edge.from_node_id,
      to: edge.to_node_id
    }));

    return { nodes, edges, collapsed: [] }; // Collapsed state not stored in DB for now
  } catch (error) {
    console.error("Failed to load from Supabase:", error);
    return null;
  }
};

// Unified save/load functions that choose storage method
export const saveData = async (nodes, edges, collapsedIds) => {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    return await saveToSupabase(nodes, edges, collapsedIds);
  } else {
    return saveToLocalStorage(nodes, edges, collapsedIds);
  }
};

export const loadData = async () => {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    const supabaseData = await loadFromSupabase();
    if (supabaseData) return supabaseData;
  }
  
  // Fallback to localStorage
  return loadFromLocalStorage();
};

// Migration function to move localStorage data to Supabase when user signs up
export const migrateLocalStorageToSupabase = async (nodes, edges, collapsedIds) => {
  try {
    const result = await saveToSupabase(nodes, edges, collapsedIds);
    if (result.success) {
      // Clear localStorage after successful migration
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return { success: true };
    }
    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error };
  }
};