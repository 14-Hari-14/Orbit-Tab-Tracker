import { supabase } from './supabaseClient';

/**
 * Fetches all nodes and edges for the current user.
 */
export const fetchGraphData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { nodes: [], edges: [] };

    // Fetch nodes and edges in parallel for better performance
    const [nodesResponse, edgesResponse] = await Promise.all([
        supabase.from('nodes').select('*').eq('user_id', user.id),
        supabase.from('edges').select('*').eq('user_id', user.id)
    ]);

    const { data: nodes, error: nodesError } = nodesResponse;
    const { data: edges, error: edgesError } = edgesResponse;

    if (nodesError || edgesError) {
        console.error('Error fetching data:', nodesError || edgesError);
        return { nodes: [], edges: [] };
    }

    // The database stores 'from_node' and 'to_node'. 
    // We format them here so vis.js can use them directly as 'from' and 'to'.
    const formattedEdges = edges.map(edge => ({
        id: edge.id,
        from: edge.from_node,
        to: edge.to_node
    }));

    return { nodes, edges: formattedEdges };
};


/**
 * Saves a new node to the database.
 * @param {object} node - The node object created on the client.
 */
export const addNodeToSupabase = async (node) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // ✅ Use destructuring to separate the temporary client-side 'id'
    const { id: tempClientId, ...nodeData } = node;

    const { data, error } = await supabase
        .from('nodes')
        // ✅ Insert the node data WITHOUT the temporary id, 
        // and use the tempId to populate the 'client_id' column.
        .insert({ ...nodeData, client_id: tempClientId, user_id: user.id })
        .select()
        .single();

    if (error) console.error('Error adding node:', error);
    return data;
};



/**
 * Saves a new edge connecting two nodes to the database.
 * @param {string} fromNodeId - The UUID of the parent node.
 * @param {string} toNodeId - The UUID of the new child node.
 */
// In api.js
export const addEdgeToSupabase = async (fromNodeId, toNodeId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('edges')
        .insert({ from_node: fromNodeId, to_node: toNodeId, user_id: user.id })
        // Explicitly select the columns needed by vis.js
        .select('id, from_node, to_node')
        .single();

    if (error) console.error('Error adding edge:', error);
    return data;
};

/**
 * Updates an existing node in the database.
 * @param {object} node - The node object with updated fields (label, url, note).
 */
export const updateNodeInSupabase = async (node) => {
    const { error } = await supabase
        .from('nodes')
        .update({
            label: node.label,
            url: node.url,
            note: node.note,
        })
        .eq('id', node.id); // Find the correct node by its unique ID

    if (error) console.error("Error updating node:", error);
};

/**
 * Deletes a node and all edges connected to it.
 * @param {string} nodeId - The UUID of the node to delete.
 */
export const deleteNodeFromSupabase = async (nodeId) => {
    // IMPORTANT: We must delete the connecting edges first to maintain data integrity.
    const { error: edgeError } = await supabase
        .from('edges')
        .delete()
        .or(`from_node.eq.${nodeId},to_node.eq.${nodeId}`); // Deletes edges where this node is the start OR the end

    if (edgeError) {
        console.error("Error deleting edges:", edgeError);
        return; // Stop if we can't delete the edges
    }

    // After edges are gone, delete the node itself.
    const { error: nodeError } = await supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId);

    if (nodeError) console.error("Error deleting node:", nodeError);
};