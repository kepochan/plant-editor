import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface DiagramEvent {
  sessionId: string;
  version: number;
  type: 'update' | 'comment';
}

@Injectable()
export class EventsService {
  private events$ = new Subject<DiagramEvent>();

  emitUpdate(sessionId: string, version: number): void {
    this.events$.next({ sessionId, version, type: 'update' });
  }

  emitComment(sessionId: string, version: number): void {
    this.events$.next({ sessionId, version, type: 'comment' });
  }

  getEventsForSession(sessionId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => event.sessionId === sessionId),
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
          }) as MessageEvent,
      ),
    );
  }
}
