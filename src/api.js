import { supabase } from './components/supabaseClient';

/**
 * Fetches all nodes and edges for the currently logged-in user.
 */
async function fetchGraphData() {
    const { data: nodes, error: nError } = await supabase.from('nodes').select('*');
    if (nError) throw nError;

    const { data: edges, error: eError } = await supabase.from('edges').select('*');
    if (eError) throw eError;

    return { nodes, edges };
}

/**
 * Adds a new node to the database for the current user.
 * @param {object} nodeData - The data for the new node (label, url, etc.).
 * @returns {object} The newly created node from the database.
 */
async function addNode(nodeData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for adding a node.");

    const { data, error } = await supabase
        .from('nodes')
        .insert({ ...nodeData, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Adds a new edge to connect two nodes.
 * @param {number} fromNodeId - The ID of the parent node.
 * @param {number} toNodeId - The ID of the child node.
 * @returns {object} The newly created edge from the database.
 */
async function addEdge(fromNodeId, toNodeId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for adding an edge.");

    const { data, error } = await supabase
        .from('edges')
        .insert({ from_node: fromNodeId, to_node: toNodeId, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Updates an existing node in the database.
 * @param {object} nodeData - The node object, including its 'id' and fields to update.
 * @returns {object} The updated node from the database.
 */
async function updateNode(nodeData) {
    const { id, ...updateData } = nodeData;
    const { data, error } = await supabase
        .from('nodes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Deletes a node from the database.
 * @param {number} nodeId - The ID of the node to delete.
 */
async function deleteNode(nodeId) {
    const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
    if (error) throw error;
}

// /**
//  * Updates only the x and y position of an existing node.
//  * @param {number} nodeId - The ID of the node to update.
//  * @param {object} position - An object with { x, y } coordinates.
//  */
// async function updateNodePosition(nodeId, position) {
//     const { error } = await supabase
//         .from('nodes')
//         .update({ x: position.x, y: position.y })
//         .eq('id', nodeId);

//     if (error) throw error;
// }

// Export all functions as a single object
export const api = {
    fetchGraphData,
    addNode,
    addEdge,
    updateNode,
    deleteNode,
    // updateNodePosition,
};

