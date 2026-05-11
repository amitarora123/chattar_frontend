export interface GetSignedUrlProps {
  folder: string;
}

export interface GetSignedUrlResponse {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  upload_preset: string;
}

export interface UploadImageResponse {
  secure_url: string;
  public_id: string;
}
