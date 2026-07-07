import { randomUUID } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class StorageService {
  private readonly root = join(process.cwd(), process.env.STORAGE_LOCAL_PATH ?? "storage/uploads");
  private readonly driver = process.env.STORAGE_DRIVER ?? "local";
  private readonly s3Client: S3Client | null;

  constructor() {
    if (this.driver === "s3") {
      this.s3Client = new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
        },
      });
    } else {
      this.s3Client = null;
      if (!existsSync(this.root)) {
        mkdirSync(this.root, { recursive: true });
      }
    }
  }

  async save(buffer: Buffer, originalName: string, subdir: string): Promise<string> {
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${randomUUID()}-${safeName}`;
    const key = `${subdir}/${fileName}`;

    if (this.driver === "s3" && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: buffer,
        }),
      );
      const base = process.env.S3_PUBLIC_URL_BASE;
      return base ? `${base.replace(/\/$/, "")}/${key}` : `/uploads/${key}`;
    }

    const dir = join(this.root, subdir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(join(dir, fileName), buffer);
    return `/uploads/${key}`;
  }
}
