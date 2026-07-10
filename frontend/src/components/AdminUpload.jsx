import { useState } from 'react';
import { NavLink, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { AlertCircle, ArrowLeft, CheckCircle2, FileVideo, UploadCloud, Video } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { BackBar, HeroPanel, PageShell } from './CodeVerseUI';

function AdminUpload() {
  const { problemId } = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors
  } = useForm();

  const selectedFile = watch('videoFile')?.[0];

  const onSubmit = async (data) => {
    const file = data.videoFile[0];

    setUploading(true);
    setUploadProgress(0);
    setUploadedVideo(null);
    clearErrors();

    try {
      const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
      const { signature, timestamp, public_id, api_key, upload_url } = signatureResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      const uploadResponse = await axios.post(upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.loaded || 1;
          const progress = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(progress);
        },
      });

      const cloudinaryResult = uploadResponse.data;

      const metadataResponse = await axiosClient.post('/video/save', {
        problemId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
      });

      setUploadedVideo(metadataResponse.data.videoSolution);
      setUploadProgress(100);
      reset();
    } catch (err) {
      console.error('Upload error:', err);
      setError('root', {
        type: 'manual',
        message: err.response?.data?.message || 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="cv-page">
      <PageShell className="max-w-5xl">
        <BackBar to="/admin/video" label="Video Library" right={<div className="cv-chip">Upload editorial</div>} />

        <HeroPanel
          eyebrow="Problem video"
          title="Upload Solution Video"
          subtitle="Add a clear editorial video so learners can review the idea after attempting the problem."
          icon={Video}
        />

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <form onSubmit={handleSubmit(onSubmit)} className="cv-panel p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Choose Video File</h2>
                <p className="text-sm text-base-content/60">MP4, WebM, or any browser-supported video format.</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-5">
              <input
                type="file"
                accept="video/*"
                {...register('videoFile', {
                  required: 'Please select a video file',
                  validate: {
                    isVideo: (files) => {
                      if (!files || !files[0]) return 'Please select a video file';
                      const file = files[0];
                      return file.type.startsWith('video/') || 'Please select a valid video file';
                    },
                    fileSize: (files) => {
                      if (!files || !files[0]) return true;
                      const file = files[0];
                      const maxSize = 100 * 1024 * 1024;
                      return file.size <= maxSize || 'File size must be less than 100MB';
                    }
                  }
                })}
                className={`file-input file-input-bordered file-input-primary w-full ${errors.videoFile ? 'file-input-error' : ''}`}
                disabled={uploading}
              />
              {errors.videoFile && (
                <p className="mt-2 text-sm text-error">{errors.videoFile.message}</p>
              )}
            </div>

            {selectedFile && (
              <div className="mt-5 rounded-2xl border border-base-300 bg-base-200/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-info/10 text-info">
                    <FileVideo className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">Selected file</h3>
                    <p className="truncate text-sm text-base-content/70">{selectedFile.name}</p>
                    <p className="text-sm text-base-content/50">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              </div>
            )}

            {uploading && (
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Uploading</span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress className="progress progress-primary w-full" value={uploadProgress} max="100"></progress>
              </div>
            )}

            {errors.root && (
              <div className="alert alert-error mt-5 rounded-2xl">
                <AlertCircle className="h-5 w-5" />
                <span>{errors.root.message}</span>
              </div>
            )}

            {uploadedVideo && (
              <div className="alert alert-success mt-5 rounded-2xl">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <h3 className="font-bold">Upload successful</h3>
                  <p className="text-sm">
                    Duration: {formatDuration(uploadedVideo.duration)}
                    {uploadedVideo.uploadedAt ? `, uploaded ${new Date(uploadedVideo.uploadedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
            )}

            <button type="submit" disabled={uploading} className="btn btn-primary mt-6 w-full rounded-full gap-2">
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Uploading video
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload Video
                </>
              )}
            </button>
          </form>

          <aside className="cv-panel p-5">
            <h2 className="text-lg font-bold">Upload Checklist</h2>
            <div className="mt-4 space-y-3">
              <ChecklistItem text="Use a clear title frame or thumbnail." />
              <ChecklistItem text="Keep the explanation focused on the core pattern." />
              <ChecklistItem text="Mention complexity and edge cases near the end." />
              <ChecklistItem text="File size must stay under 100MB." />
            </div>
            <div className="mt-6 rounded-2xl bg-base-200 p-4 text-sm text-base-content/60">
              Problem ID:
              <span className="mt-1 block break-all font-mono text-xs text-base-content">{problemId}</span>
            </div>
          </aside>
        </section>
      </PageShell>
    </div>
  );
}

function ChecklistItem({ text }) {
  return (
    <div className="flex gap-2 text-sm text-base-content/70">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <span>{text}</span>
    </div>
  );
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDuration = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default AdminUpload;
