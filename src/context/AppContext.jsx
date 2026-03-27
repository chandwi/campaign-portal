import React, { createContext, useContext, useReducer, useCallback } from 'react'
import {
  MOCK_USER,
  INITIAL_CAMPAIGNS,
  INITIAL_TEMPLATES,
  INITIAL_CONTACTS,
  INITIAL_OPT_OUTS,
} from '../data/mockData'

const AppContext = createContext(null)

// Derive the suppression phone list from the opt-out log (active entries only)
const deriveSuppressionList = (optOutLog) =>
  optOutLog.filter(o => o.status === 'active').map(o => o.phone)

const initialState = {
  user: null,
  campaigns: INITIAL_CAMPAIGNS,
  templates: INITIAL_TEMPLATES,
  contactLists: INITIAL_CONTACTS,
  optOutLog: INITIAL_OPT_OUTS,
  toasts: [],
  suppressionList: deriveSuppressionList(INITIAL_OPT_OUTS),
}

let toastId = 0

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: MOCK_USER }
    case 'LOGOUT':
      return { ...state, user: null }

    case 'ADD_CAMPAIGN':
      return { ...state, campaigns: [action.payload, ...state.campaigns] }
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      }
    case 'DELETE_CAMPAIGN':
      return { ...state, campaigns: state.campaigns.filter(c => c.id !== action.id) }

    case 'ADD_TEMPLATE':
      return { ...state, templates: [action.payload, ...state.templates] }
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'ARCHIVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.id ? { ...t, status: 'archived' } : t
        ),
      }

    case 'ADD_CONTACT_LIST':
      return { ...state, contactLists: [action.payload, ...state.contactLists] }
    case 'UPDATE_CONTACT_LIST':
      return {
        ...state,
        contactLists: state.contactLists.map(cl =>
          cl.id === action.payload.id ? { ...cl, ...action.payload } : cl
        ),
      }
    case 'DELETE_CONTACT_LIST':
      return { ...state, contactLists: state.contactLists.filter(cl => cl.id !== action.id) }

    case 'ADD_OPT_OUT': {
      const newLog = [action.payload, ...state.optOutLog]
      return {
        ...state,
        optOutLog: newLog,
        suppressionList: deriveSuppressionList(newLog),
      }
    }
    case 'RESUBSCRIBE_CONTACT': {
      const newLog = state.optOutLog.map(o =>
        o.id === action.id
          ? { ...o, status: 'resubscribed', resubscribedAt: new Date().toISOString() }
          : o
      )
      return {
        ...state,
        optOutLog: newLog,
        suppressionList: deriveSuppressionList(newLog),
      }
    }

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const login = useCallback((email, password) => {
    // Simulate auth — accept any credentials
    dispatch({ type: 'LOGIN' })
    return true
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' })
  }, [])

  const toast = useCallback((message, type = 'info', title = null) => {
    const id = ++toastId
    const defaultTitles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' }
    dispatch({
      type: 'ADD_TOAST',
      payload: { id, type, title: title || defaultTitles[type], message },
    })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', id })
  }, [])

  const addCampaign = useCallback((campaign) => {
    dispatch({ type: 'ADD_CAMPAIGN', payload: campaign })
  }, [])

  const updateCampaign = useCallback((campaign) => {
    dispatch({ type: 'UPDATE_CAMPAIGN', payload: campaign })
  }, [])

  const deleteCampaign = useCallback((id) => {
    dispatch({ type: 'DELETE_CAMPAIGN', id })
  }, [])

  const addTemplate = useCallback((template) => {
    dispatch({ type: 'ADD_TEMPLATE', payload: template })
  }, [])

  const updateTemplate = useCallback((template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template })
  }, [])

  const archiveTemplate = useCallback((id) => {
    dispatch({ type: 'ARCHIVE_TEMPLATE', id })
  }, [])

  const addContactList = useCallback((list) => {
    dispatch({ type: 'ADD_CONTACT_LIST', payload: list })
  }, [])

  const updateContactList = useCallback((list) => {
    dispatch({ type: 'UPDATE_CONTACT_LIST', payload: list })
  }, [])

  const deleteContactList = useCallback((id) => {
    dispatch({ type: 'DELETE_CONTACT_LIST', id })
  }, [])

  const addOptOut = useCallback((record) => {
    dispatch({ type: 'ADD_OPT_OUT', payload: record })
  }, [])

  const resubscribeContact = useCallback((id) => {
    dispatch({ type: 'RESUBSCRIBE_CONTACT', id })
  }, [])

  const value = {
    ...state,
    login,
    logout,
    toast,
    removeToast,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addTemplate,
    updateTemplate,
    archiveTemplate,
    addContactList,
    updateContactList,
    deleteContactList,
    addOptOut,
    resubscribeContact,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
