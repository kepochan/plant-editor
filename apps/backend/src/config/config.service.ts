import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get apiKeys(): string[] {
    const keys = process.env.API_KEYS || process.env.API_KEY || 'dev-api-key';
    return keys.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
  }

  get plantUmlServerUrl(): string {
    return process.env.PLANTUML_SERVER_URL || 'http://localhost:8083';
  }

  get plantUmlPublicUrl(): string {
    return process.env.PLANTUML_PUBLIC_URL || 'https://plant.kepochan.com';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || '*';
  }

  // Database configuration
  get databaseHost(): string {
    return process.env.DATABASE_HOST || 'localhost';
  }

  get databasePort(): number {
    return parseInt(process.env.DATABASE_PORT || '5432', 10);
  }

  get databaseName(): string {
    return process.env.DATABASE_NAME || 'plant_editor';
  }

  get databaseUser(): string {
    return process.env.DATABASE_USER || 'plant_editor';
  }

  get databasePassword(): string {
    return process.env.DATABASE_PASSWORD || 'password';
  }

  get maxVersions(): number {
    return 100;
  }

  // Google OAuth configuration
  get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  // JWT configuration
  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
  }

  // URLs
  get baseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  // Admin configuration
  get adminEmail(): string {
    return process.env.ADMIN_EMAIL || '';
  }
}
