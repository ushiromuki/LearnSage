import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { insertFileSchema, type InsertFile } from "@shared/schema";
import { storage } from "./storage";
import crypto from "crypto";
import path from "path";

// S3クライアントの設定
export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

// ファイル名を安全にユニークな形式に変換する関数
function generateUniqueFilename(originalname: string) {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString("hex");
  const extension = path.extname(originalname);
  return `${timestamp}-${hash}${extension}`;
}

// multerの設定
export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET || "",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, callback) => {
      const filename = generateUniqueFilename(file.originalname);
      callback(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: (_req, file, callback) => {
    // 許可するファイルタイプ
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "video/mp4",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Invalid file type"));
    }
  },
});

// ファイルメタデータをデータベースに保存する関数
export async function saveFileMetadata(
  file: Express.MulterS3.File,
  courseId: number,
  uploaderId: number,
): Promise<InsertFile> {
  const fileData = {
    filename: file.key,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: file.location,
    courseId,
    uploaderId,
  };

  return await storage.createFile(fileData);
}