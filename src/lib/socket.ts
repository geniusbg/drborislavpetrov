// Global socket.io instance
declare global {
  // eslint-disable-next-line no-var
  var io: import('socket.io').Server | undefined;
}

export function getIO(): import('socket.io').Server | null {
  if (!globalThis.io) {
    console.warn('⚠️ Socket.io not initialized yet')
    return null
  }
  return globalThis.io
}

// Helper functions to emit events with improved error handling
export function emitBookingUpdate(booking: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting booking-updated event:', booking)
    socketIO.to('admin').emit('booking-updated', booking)
  } else {
    console.warn('⚠️ Socket.io not available for booking-updated event')
  }
}

export function emitBookingAdded(booking: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting booking-added event:', booking)
    socketIO.to('admin').emit('booking-added', booking)
  } else {
    console.warn('⚠️ Socket.io not available for booking-added event')
  }
}

export function emitBookingDeleted(bookingId: string) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting booking-deleted event:', bookingId)
    socketIO.to('admin').emit('booking-deleted', bookingId)
  } else {
    console.warn('⚠️ Socket.io not available for booking-deleted event')
  }
}

export function emitNextBookingChanged(booking: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting next-booking-changed event:', booking)
    socketIO.to('admin').emit('next-booking-changed', booking)
  } else {
    console.warn('⚠️ Socket.io not available for next-booking-changed event')
  }
}

export function emitUserAdded(user: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting user-added event:', user)
    socketIO.to('admin').emit('user-added', user)
  } else {
    console.warn('⚠️ Socket.io not available for user-added event')
  }
}

export function emitUserUpdate(user: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting user-updated event:', user)
    socketIO.to('admin').emit('user-updated', user)
  } else {
    console.warn('⚠️ Socket.io not available for user-updated event')
  }
}

export function emitUserDeleted(userId: string) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting user-deleted event:', userId)
    socketIO.to('admin').emit('user-deleted', userId)
  } else {
    console.warn('⚠️ Socket.io not available for user-deleted event')
  }
}

export function emitServiceAdded(service: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting service-added event:', service)
    socketIO.to('admin').emit('service-added', service)
  } else {
    console.warn('⚠️ Socket.io not available for service-added event')
  }
}

export function emitServiceUpdate(service: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting service-updated event:', service)
    socketIO.to('admin').emit('service-updated', service)
  } else {
    console.warn('⚠️ Socket.io not available for service-updated event')
  }
}

export function emitServiceDeleted(serviceId: string) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting service-deleted event:', serviceId)
    socketIO.to('admin').emit('service-deleted', serviceId)
  } else {
    console.warn('⚠️ Socket.io not available for service-deleted event')
  }
}

export function emitWorkingHoursUpdated(workingHours: unknown) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting working-hours-updated event:', workingHours)
    socketIO.to('admin').emit('working-hours-updated', workingHours)
  } else {
    console.warn('⚠️ Socket.io not available for working-hours-updated event')
  }
}

export function emitWorkingHoursDeleted(date: string) {
  const socketIO = getIO()
  if (socketIO) {
    console.log('📡 Emitting working-hours-deleted event:', date)
    socketIO.to('admin').emit('working-hours-deleted', date)
  } else {
    console.warn('⚠️ Socket.io not available for working-hours-deleted event')
  }
} 