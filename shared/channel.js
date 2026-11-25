export const openChannel = (name, ChannelImpl = globalThis.BroadcastChannel) => {
  const channel = new ChannelImpl(name)

  const send = (message) => channel.postMessage(message)

  const subscribe = (handler) => {
    const listener = (event) => handler(event.data)
    channel.addEventListener('message', listener)
    return () => channel.removeEventListener('message', listener)
  }

  const close = () => channel.close()

  return { send, subscribe, close }
}

export const stateMessage = (state) => ({ type: 'state', state })

export const helloMessage = () => ({ type: 'hello' })

// Sent directly on the channel while the host drags the current card, never
// through the store: pointer moves are far too frequent for a reducer
// dispatch (which persists to storage and rebroadcasts full state on every
// call). x and y are the dragged card's centre as fractions (0..1) of the
// stage box; both are null when the drag ends or is cancelled.
export const dragMessage = (x, y) => ({ type: 'drag', x, y })
