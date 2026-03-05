import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const minioConfig = this.config.get('app.minio');
    this.bucket = minioConfig.bucket;
    this.client = new Minio.Client({
      endPoint: minioConfig.endpoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
    } catch (err) {
      this.logger.warn(`MinIO not available: ${err.message}. File storage disabled.`);
    }
  }

  async uploadBuffer(objectName: string, buffer: Buffer, contentType = 'application/pdf'): Promise<string> {
    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return objectName;
  }

  async uploadStream(objectName: string, stream: Readable, size: number, contentType = 'application/octet-stream'): Promise<string> {
    await this.client.putObject(this.bucket, objectName, stream, size, {
      'Content-Type': contentType,
    });
    return objectName;
  }

  async getPresignedUrl(objectName: string, expirySeconds = 900): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }

  async getObject(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectName);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteObject(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }
}
