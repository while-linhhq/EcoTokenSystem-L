import { createContext, useContext, useState, useEffect } from 'react';
import { 
  submitActionApi, 
  getPendingActionsApi, 
  getApprovedActionsApi, 
  getRejectedActionsApi, 
  getUserActionsApi,
  approveActionApi,
  rejectActionApi
} from '../api/actionsApi';

const ActionsContext = createContext();

export const useActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within ActionsProvider');
  }
  return context;
};

export const ActionsProvider = ({ children }) => {
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load pending actions from API
  const loadActions = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getPendingActionsApi(),
        getApprovedActionsApi(),
        getRejectedActionsApi()
      ]);
      
      const allActions = [
        ...(pendingRes.success ? pendingRes.data : []),
        ...(approvedRes.success ? approvedRes.data : []),
        ...(rejectedRes.success ? rejectedRes.data : [])
      ];
      
      setPendingActions(allActions);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const addPendingAction = async (action) => {
    try {
      const response = await submitActionApi(action);
      if (response.success) {
        setPendingActions(prev => [...prev, response.data]);
        return { success: true, message: response.message, data: response.data };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const approveAction = async (actionId, comment = '', rewards = { streak: 1, ecoTokens: 10 }) => {
    try {
      const response = await approveActionApi(actionId, comment, rewards);
      if (response.success) {
        setPendingActions(prev =>
          prev.map(action =>
            action.id === actionId ? response.data : action
          )
        );
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const rejectAction = async (actionId, comment) => {
    try {
      const response = await rejectActionApi(actionId, comment);
      if (response.success) {
        setPendingActions(prev =>
          prev.map(action =>
            action.id === actionId ? response.data : action
          )
        );
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const getPendingActions = () => {
    return pendingActions.filter(action => action.status === 'pending');
  };

  const getApprovedActions = () => {
    return pendingActions.filter(action => action.status === 'approved');
  };

  const getRejectedActions = () => {
    return pendingActions.filter(action => action.status === 'rejected');
  };

  const getUserActions = async (userId) => {
    try {
      const response = await getUserActionsApi(userId);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      // Fallback to local data
      return pendingActions.filter(action => action.userId === userId);
    }
  };

  return (
    <ActionsContext.Provider
      value={{
        pendingActions,
        loading,
        addPendingAction,
        approveAction,
        rejectAction,
        getPendingActions,
        getApprovedActions,
        getRejectedActions,
        getUserActions,
        loadActions
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};

