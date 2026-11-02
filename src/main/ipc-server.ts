import { unlinkSync } from 'fs'
import type { Server, Socket } from 'net'
import { createServer } from 'net'

import { parseCliEvent } from '@main/cli-event-parser'
import { createLogger } from '@main/logger'
import type { CliEvent, StatusReport } from '@shared/types'

export { parseCliEvent } from '@main/cli-event-parser'

const log = createLogger('ipc-server')

function getSocketPath(): string {
  const uid = process.getuid?.() ?? 'default'
  return `/tmp/termcat-${uid}.sock`
}

interface IpcServerHandlers {
  onEvent: (event: CliEvent) => void
  /** `status:get` 요청에 답할 현황. `termcat status` 가 쓴다 */
  getStatus: () => StatusReport
}

function handleConnection(socket: Socket, handlers: IpcServerHandlers): void {
  const sessionPids = new Set<number>()
  let buffer = ''

  function dispatch(event: CliEvent): void {
    if (event.type === 'status:get') {
      socket.end(JSON.stringify(handlers.getStatus()) + '\n')
      return
    }
    if (event.type === 'session:start') sessionPids.add(event.pid)
    if (event.type === 'session:exit') sessionPids.delete(event.pid)
    handlers.onEvent(event)
  }

  socket.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        dispatch(parseCliEvent(JSON.parse(line)))
      } catch (err) {
        log.warn('failed to parse event:', err)
      }
    }
  })

  socket.on('close', () => {
    for (const pid of sessionPids) {
      handlers.onEvent({ type: 'session:exit', pid, code: -1 })
    }
  })

  socket.on('error', (err) => {
    log.warn('socket error:', err)
    socket.destroy()
  })
}

export type IpcServer = ReturnType<typeof createIpcServer>

export function createIpcServer(handlers: IpcServerHandlers) {
  const socketPath = getSocketPath()
  const server: Server = createServer((socket) => handleConnection(socket, handlers))

  return {
    start(): void {
      try {
        unlinkSync(socketPath)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT')
          log.warn('failed to unlink socket:', err)
      }
      server.listen(socketPath)
    },
    stop(): void {
      server.close()
      try {
        unlinkSync(socketPath)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT')
          log.warn('failed to unlink socket:', err)
      }
    },
  }
}
