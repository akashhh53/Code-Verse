import { useEffect, useRef, useState } from 'react';
import { Pause, Play, VideoOff } from 'lucide-react';

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(Number(duration) || 0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setVideoDuration(Number(duration) || 0);
  }, [duration]);

  useEffect(() => {
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };

    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  if (!secureUrl) {
    return (
      <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center">
        <VideoOff className="mx-auto h-10 w-10 text-base-content/35" />
        <h3 className="mt-4 text-lg font-semibold">No editorial video yet</h3>
        <p className="mt-2 text-sm text-base-content/60">
          A video explanation will appear here after an admin uploads one.
        </p>
      </div>
    );
  }

  const maxDuration = Math.max(videoDuration, 1);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
      <div
        className="relative bg-black"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          src={secureUrl}
          poster={thumbnailUrl}
          onClick={togglePlayPause}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration || Number(duration) || 0)}
          className="aspect-video w-full cursor-pointer bg-black"
        />

        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
            isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              className="btn btn-primary btn-circle btn-sm"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <span className="w-11 text-sm font-medium text-white">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={maxDuration}
              value={Math.min(currentTime, maxDuration)}
              onChange={(event) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Number(event.target.value);
                }
              }}
              className="range range-primary range-xs flex-1"
            />
            <span className="w-11 text-right text-sm font-medium text-white">{formatTime(videoDuration)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold">Editorial Walkthrough</h3>
        <p className="mt-1 text-sm text-base-content/60">
          Watch the explanation, then return to the code editor and try the idea yourself.
        </p>
      </div>
    </div>
  );
};

const formatTime = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default Editorial;
