import { stateMessage } from './channel.js'

const loadState = ({ storage, storageKey, initialState }) => {
  try {
    const saved = storage?.getItem(storageKey)
    return saved ? JSON.parse(saved) : initialState
  } catch {
    return initialState
  }
}

export const createStore = ({
  reducer,
  initialState,
  storageKey,
  channel,
  storage = globalThis.localStorage,
  onHello,
}) => {
  let state = loadState({ storage, storageKey, initialState })
  const listeners = new Set()

  const getState = () => state

  const persist = () => {
    try {
      storage?.setItem(storageKey, JSON.stringify(state))
    } catch {
      // storage unavailable or full; in-memory state remains the source of truth
    }
  }

  const dispatch = (action) => {
    state = reducer(state, action)
    listeners.forEach((listener) => listener(state))
    channel?.send(stateMessage(state))
    persist()
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  channel?.subscribe((message) => {
    if (message?.type === 'hello') {
      channel.send(stateMessage(getState()))
      onHello?.()
    }
  })

  return { getState, dispatch, subscribe }
}
