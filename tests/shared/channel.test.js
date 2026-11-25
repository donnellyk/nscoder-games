import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openChannel, stateMessage, helloMessage, dragMessage } from '../../shared/channel.js'

class FakeBroadcastChannel {
  constructor(name) {
    this.name = name
    this.listeners = new Set()
    this.sent = []
    this.closed = false
  }

  postMessage(data) {
    this.sent.push(data)
  }

  addEventListener(type, listener) {
    if (type === 'message') this.listeners.add(listener)
  }

  removeEventListener(type, listener) {
    if (type === 'message') this.listeners.delete(listener)
  }

  close() {
    this.closed = true
  }

  emit(data) {
    this.listeners.forEach((listener) => listener({ data }))
  }
}

test('send posts a plain object to the underlying channel', () => {
  let impl
  const Impl = class extends FakeBroadcastChannel {
    constructor(name) {
      super(name)
      impl = this
    }
  }
  const channel = openChannel('timeline', Impl)
  channel.send(helloMessage())
  assert.deepEqual(impl.sent, [{ type: 'hello' }])
})

test('subscribe receives messages emitted on the channel', () => {
  let impl
  const Impl = class extends FakeBroadcastChannel {
    constructor(name) {
      super(name)
      impl = this
    }
  }
  const channel = openChannel('timeline', Impl)
  const received = []
  channel.subscribe((message) => received.push(message))

  impl.emit(stateMessage({ round: 1 }))

  assert.deepEqual(received, [{ type: 'state', state: { round: 1 } }])
})

test('unsubscribe stops delivering messages', () => {
  let impl
  const Impl = class extends FakeBroadcastChannel {
    constructor(name) {
      super(name)
      impl = this
    }
  }
  const channel = openChannel('timeline', Impl)
  const received = []
  const unsubscribe = channel.subscribe((message) => received.push(message))

  unsubscribe()
  impl.emit(helloMessage())

  assert.deepEqual(received, [])
})

test('close closes the underlying channel', () => {
  let impl
  const Impl = class extends FakeBroadcastChannel {
    constructor(name) {
      super(name)
      impl = this
    }
  }
  const channel = openChannel('timeline', Impl)
  channel.close()
  assert.equal(impl.closed, true)
})

test('stateMessage and helloMessage build the expected shapes', () => {
  assert.deepEqual(stateMessage({ a: 1 }), { type: 'state', state: { a: 1 } })
  assert.deepEqual(helloMessage(), { type: 'hello' })
})

test('dragMessage builds the expected shape, including the drag-end form', () => {
  assert.deepEqual(dragMessage(0.42, 0.75), { type: 'drag', x: 0.42, y: 0.75 })
  assert.deepEqual(dragMessage(null, null), { type: 'drag', x: null, y: null })
})
