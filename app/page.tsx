'use client';

import React, { useState } from 'react';

interface SignedUploadParameters {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  upload_preset: string;
}
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadParameters, setUploadParameters] =
    useState<SignedUploadParameters | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];

      console.log(file);
      if (!file) {
        alert('File not found');
        return;
      }

      setFile(file);

      const res = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: {
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkyY2I3ZGMxYzVhZjk2ZjE4ZWNjMWIiLCJ1c2VybmFtZSI6ImFtaXQyIiwiZW1haWwiOiJhbWl0MkBleGFtcGxlLmNvbSIsImlhdCI6MTc3MTIzMzUwOH0.FxN6G2vtbMAKOvB2vregp9z54NSxriq1Bt2bKu7Q1Q0',
        },
      });

      const response: SignedUploadParameters = await res.json();

      setUploadParameters(response);
      console.log(response);
      setTimeout(() => {
        setUploadParameters(null);
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  };

  async function uploadToCloudinary() {
    console.log(uploadParameters);
    if (!file) {
      alert('please select a file');
      return;
    }

    if (!uploadParameters) {
      alert('upload parameters expired');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', uploadParameters.api_key);
    formData.append('timestamp', uploadParameters.timestamp.toString());
    formData.append('signature', uploadParameters.signature);
    formData.append('upload_preset', uploadParameters.upload_preset);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${uploadParameters.cloud_name}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    const uploadData = await uploadRes.json();

    return uploadData.secure_url; // Save this in DB
  }

  return (
    <div>
      <main>
        <input
          type="file"
          className="placeholder:text-black text-black"
          onChange={handleFileChange}
        />
        <button className="text-black" onClick={uploadToCloudinary}>
          upload
        </button>
      </main>
    </div>
  );
}
