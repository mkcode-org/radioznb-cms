import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import RecordingsForm from "./RecordingsForm";
import { Download, Edit, Trash } from "lucide-react";
import RecordingDownload from "./RecordingDownload";

export function RecordingsManager() {
  const recordings = useQuery(api.recordings.list);
  const programs = useQuery(api.programs.list);
  const people = useQuery(api.people.list);
  const genres = useQuery(api.genres.list);

  const deleteRecording = useMutation(api.recordings.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"recordings"> | null>(null);

  const handleEdit = (recording: any) => {
    setEditingId(recording._id);
    setIsCreating(true);
  };

  const handleDelete = async (id: Id<"recordings">) => {
    if (confirm("вы уверены, что хотите удалить эту запись?")) {
      try {
        await deleteRecording({ id });
        toast.success("файл удалён успешно");
      } catch (error) {
        console.log(error);
        toast.error("не удалось удалить файл");
      }
    }
  };

  if (!recordings) {
    return <div className="p-6">загрузка файлов...</div>;
  }

  function formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">файлы</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
          >
            добавить файл
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? "редактор" : "новый файл"}
          </h3>
          <RecordingsForm
            editingId={editingId}
            setEditingId={setEditingId}
            setIsCreating={setIsCreating}
          />
        </div>
      )}

      <div className="space-y-4">
        {recordings.map((recording) => (
          <div key={recording._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-stretch">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium">
                    {recording.episodeTitle}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      recording.status === "published"
                        ? "bg-green-100 text-green-800"
                        : recording.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {recording.status === "published"
                      ? "опубликовано"
                      : recording.status === "draft"
                        ? "черновик"
                        : "скрыто"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      recording.type === "live"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-primary"
                    }`}
                  >
                    {recording.type === "live" ? "прямой эфир" : "подкаст"}
                  </span>
                </div>
                <p className="text-gray-600 mb-1 text-lg">
                  передача: {recording.program}
                </p>
                {recording.description && (
                  <p className="text-gray-600 mb-2">{recording.description}</p>
                )}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    дата выхода:{" "}
                    {new Date(recording.airDate).toLocaleDateString("ru-RU")}
                  </p>
                  {recording.duration && (
                    <p>длительность: {formatDuration(recording.duration)}</p>
                  )}
                  {recording.keywords && (
                    <p>ключевые слова: {recording.keywords}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-between ml-4">
                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => handleEdit(recording)}
                    className="text-primary hover:text-primary-hover/80"
                  >
                    <Edit />
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(recording._id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash />
                  </button>
                </div>
                <div className="flex-grow"></div>
                <div className="text-right">
                  <RecordingDownload recordingId={recording._id} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {recordings.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            создайте свою первую запись!
          </p>
        )}
      </div>
    </div>
  );
}
