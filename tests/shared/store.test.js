import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../../shared/store.js'

const reducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    default:
      return state
  }
}

const fakeChannel = () => {
  const listeners = new Set()
  const sent = []
  return {
    sent,
    send: (message) => sent.push(message),
    subscribe: (handler) => {
      listeners.add(handler)
      return () => listeners.delete(handler)
    },
    emit: (message) => listeners.forEach((handler) => handler(message)),
  }
}

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
  }
}

test('dispatch reduces state and notifies subscribers', () => {
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test',
    storage: fakeStorage(),
  })
  const seen = []
  store.subscribe((state) => seen.push(state))

  store.dispatch({ type: 'increment' })

  assert.deepEqual(store.getState(), { count: 1 })
  assert.deepEqual(seen, [{ count: 1 }])
})

test('dispatch broadcasts a state message on the channel', () => {
  const channel = fakeChannel()
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test',
    channel,
    storage: fakeStorage(),
  })

  store.dispatch({ type: 'increment' })

  assert.deepEqual(channel.sent, [{ type: 'state', state: { count: 1 } }])
})

test('dispatch persists state as JSON to storage', () => {
  const storage = fakeStorage()
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test-key',
    storage,
  })

  store.dispatch({ type: 'increment' })

  assert.equal(storage.getItem('test-key'), JSON.stringify({ count: 1 }))
})

test('restores state from storage on creation', () => {
  const storage = fakeStorage({ 'test-key': JSON.stringify({ count: 42 }) })
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test-key',
    storage,
  })

  assert.deepEqual(store.getState(), { count: 42 })
})

test('falls back to initialState when storage has unparseable data', () => {
  const storage = fakeStorage({ 'test-key': 'not json' })
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test-key',
    storage,
  })

  assert.deepEqual(store.getState(), { count: 0 })
})

test('answers a hello message with the current state and fires onHello', () => {
  const channel = fakeChannel()
  let helloFired = false
  const store = createStore({
    reducer,
    initialState: { count: 7 },
    storageKey: 'test',
    channel,
    storage: fakeStorage(),
    onHello: () => {
      helloFired = true
    },
  })

  channel.emit({ type: 'hello' })

  assert.deepEqual(channel.sent, [{ type: 'state', state: { count: 7 } }])
  assert.equal(helloFired, true)
})

test('unsubscribe stops delivering state updates', () => {
  const store = createStore({
    reducer,
    initialState: { count: 0 },
    storageKey: 'test',
    storage: fakeStorage(),
  })
  const seen = []
  const unsubscribe = store.subscribe((state) => seen.push(state))

  unsubscribe()
  store.dispatch({ type: 'increment' })

  assert.deepEqual(seen, [])
})
