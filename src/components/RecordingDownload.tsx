import { useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Download } from "lucide-react";

export default function RecordingDownload({
  recordingId,
}: {
  recordingId: Id<"recordings">;
}) {
  const url = useQuery(api.recordings.getAudioUrl, {
    id: recordingId,
  });
  return (
    <button
      className="text-secondary hover:text-secondary-hover"
      onClick={() => {
        if (!url) return;
        window.open(url, "_blank");
      }}
    >
      <Download />
    </button>
  );
}
