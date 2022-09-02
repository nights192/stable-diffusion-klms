import asyncio
from concurrent.futures import ProcessPoolExecutor
from typing import Callable
from uuid import UUID

class UUIDPresentError(Exception):
    """Raised upon detecting the existence of a UUID in a queue."""

    pass

class ClientQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.activeIds = set()

        self.current_uuid = None
        self.current_lock = asyncio.Lock()
        self.ingest_event = asyncio.Event()

        self.loop = asyncio.get_event_loop()
        self.executor = ProcessPoolExecutor(1)

        self.ingest = asyncio.create_task(self.ingest_queue())

    def shutdown(self):
        """Shuts down the ingestion loop, effectively stopping the queue."""

        self.ingest.cancel()
    
    async def ingest_queue(self):
        while True:
            await self.current_lock.acquire()
            self.current_uuid = await self.queue.get()

            self.ingest_event.set()

    def complete_task(self):
        """Ends processing of a queue item, thereafter resuming flow."""

        self.ingest_event.clear()
        self.current_lock.release()

    async def wait_uuid(self, uuid: UUID):
        """Waits until our given UUID is at the head of the ClientQueue's internal queue."""

        while True:
            await self.ingest_event.wait()
            
            if self.current_uuid == uuid:
                return

    async def execute(self, uuid: UUID, timeout: float, task: Callable, *params):
        """Attempts to push a client's task onto the ClientQueue pending execution."""

        if uuid in self.activeIds:
            raise UUIDPresentError()

        await self.queue.put(uuid)

        await self.wait_uuid(uuid)
        runningTask = self.loop.run_in_executor(self.executor, task, *params)

        try:
            results = await asyncio.wait_for(runningTask, timeout=timeout)
            self.complete_task()

        except asyncio.TimeoutError as e:
            # As we know the id of our process, given there is one slot, we may terminate it without issue.
            
            for process in self.executor._processes.values():
                process.terminate()
            
            self.executor.shutdown(True)
            self.executor = ProcessPoolExecutor(1)

            self.complete_task()

            raise e

        return results