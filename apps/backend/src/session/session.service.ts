import { Injectable, Logger } from '@nestjs/common';

export interface Comment {
  id: string;
  text: string;
  startLine: number;
  endLine: number;
  codeSnapshot: string;
  createdAt: string;
  author?: string;
  processed: boolean;
}

export interface HistoryEntry {
  code: string;
  timestamp: string;
  version: number;
}

export interface SessionData {
  code: string;
  previousCode: string | null;
  version: number;
  history: HistoryEntry[];
  comments: Map<string, Comment>;
  lastAccess: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Cleanup expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  getOrCreateSession(sessionId: string): SessionData {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        code: '',
        previousCode: null,
        version: 0,
        history: [],
        comments: new Map(),
        lastAccess: new Date(),
      };
      this.sessions.set(sessionId, session);
      this.logger.log(`Created new session: ${sessionId}`);
    } else {
      session.lastAccess = new Date();
    }
    return session;
  }

  getSession(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccess = new Date();
    }
    return session;
  }

  updateCode(sessionId: string, code: string): SessionData {
    const session = this.getOrCreateSession(sessionId);

    // Store previous code for diff
    if (session.code && session.code !== code) {
      session.previousCode = session.code;
    }

    session.code = code;
    session.version++;

    // Add to history
    session.history.push({
      code,
      timestamp: new Date().toISOString(),
      version: session.version,
    });

    // Keep only last 50 versions
    if (session.history.length > 50) {
      session.history = session.history.slice(-50);
    }

    return session;
  }

  addComment(
    sessionId: string,
    id: string,
    text: string,
    startLine: number,
    endLine: number,
    author?: string,
  ): Comment {
    const session = this.getOrCreateSession(sessionId);

    // Extract code snapshot for the selected lines
    const lines = session.code.split('\n');
    const codeSnapshot = lines.slice(startLine - 1, endLine).join('\n');

    const comment: Comment = {
      id,
      text,
      startLine,
      endLine,
      codeSnapshot,
      createdAt: new Date().toISOString(),
      author,
      processed: false,
    };

    session.comments.set(id, comment);
    return comment;
  }

  markCommentAsProcessed(sessionId: string, commentId: string): Comment | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    const comment = session.comments.get(commentId);
    if (!comment) return null;
    comment.processed = true;
    return comment;
  }

  getComments(sessionId: string): Comment[] {
    const session = this.getSession(sessionId);
    if (!session) return [];
    return Array.from(session.comments.values());
  }

  deleteComment(sessionId: string, commentId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    return session.comments.delete(commentId);
  }

  clearComments(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.comments.clear();
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccess.getTime() > this.SESSION_TTL_MS) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}
