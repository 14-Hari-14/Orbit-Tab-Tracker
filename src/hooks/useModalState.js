// not in use?
import { useState } from 'react';

export const useModalState = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    nodeData: null,
    parentId: null
  });

  const openModal = (mode, nodeId) => {
    // Modal opening logic...
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  };

  return { modalState, openModal, closeModal };
};