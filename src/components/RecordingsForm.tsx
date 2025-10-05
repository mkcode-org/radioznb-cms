import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Recording } from "../../convex/schema";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function RecordingsForm({
  editingId,
  setEditingId,
  setIsCreating,
}: {
  editingId: Id<"recordings"> | null;
  setEditingId: React.Dispatch<React.SetStateAction<Id<"recordings"> | null>>;
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const recording = useQuery(
    api.recordings.get,
    editingId ? { id: editingId } : "skip"
  );
  const recordingPeople = useQuery(
    api.recordings.getRecordingPeople,
    editingId ? { recordingId: editingId } : "skip"
  );
  const recordingGenres = useQuery(
    api.recordings.getRecordingGenres,
    editingId ? { recordingId: editingId } : "skip"
  );

  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<RecordingFormData>({
    programId: "",
    episodeTitle: "",
    description: "",
    type: "live",
    airDate: "",
    duration: undefined,
    status: "draft",
    keywords: "",
    genreIds: [],
    hosts: [],
    guests: [],
    audioFileId: undefined,
  });
  const audioFileRef = useRef<HTMLInputElement>(null);

  const programs = useQuery(api.programs.list);
  const genres = useQuery(api.genres.list);
  const people = useQuery(api.people.list);

  const generateUploadUrl = useMutation(api.recordings.generateUploadUrl);
  const createRecording = useMutation(api.recordings.create);
  const updateRecording = useMutation(api.recordings.update);

  useEffect(() => {
    if (recording) {
      let hosts: string[] = [];
      let guests: string[] = [];
      let genreIds: string[] = [];
      if (recordingPeople) {
        hosts = recordingPeople
          .filter((person: any) => person.role === "host")
          .map((person: any) => person._id);
        guests = recordingPeople
          .filter((person: any) => person.role === "guest")
          .map((person: any) => person._id);
      }
      if (recordingGenres) {
        genreIds = recordingGenres.map((genre: any) => genre._id);
      }
      setFormData({
        ...recording,
        genreIds,
        hosts,
        guests,
      });
    }
  }, [editingId]);

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener("error", () => {
        resolve(0);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (
      !file.type.includes("audio/mpeg") &&
      !file.name.toLowerCase().endsWith(".mp3")
    ) {
      toast.error("пожалуйста, выберите MP3 файл");
      return null;
    }

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("ошибка загрузки файла");
      }

      const { storageId } = await result.json();

      // Get duration
      const duration = await getAudioDuration(file);

      setFormData((prev) => ({
        ...prev,
        audioFileId: storageId,
        duration: duration,
      }));

      toast.success("Аудиофайл загружен успешно");
      return storageId;
    } catch (error) {
      console.log(error);
      toast.error("не удалось загрузить аудиофайл");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.programId ||
      !formData.episodeTitle ||
      !formData.airDate ||
      !formData.audioFileId
    ) {
      toast.error("пожалуйста, заполните все обязательные поля");
      return;
    }

    // Check for duplicate people
    const allPeople = [...formData.hosts, ...formData.guests];
    const uniquePeople = new Set(allPeople);
    if (allPeople.length !== uniquePeople.size) {
      toast.error("человек не может быть одновременно ведущим и гостем");
      return;
    }

    try {
      const recordingData = {
        programId: formData.programId as Id<"programs">,
        episodeTitle: formData.episodeTitle,
        description: formData.description || undefined,
        type: formData.type,
        airDate: formData.airDate,
        duration: formData.duration,
        status: formData.status,
        keywords: formData.keywords || undefined,
        genreIds: formData.genreIds as Id<"genres">[],
        hosts: formData.hosts as Id<"people">[],
        guests: formData.guests as Id<"people">[],
        audioFileId: formData.audioFileId,
      };

      if (editingId) {
        await updateRecording({
          id: editingId,
          ...recordingData,
        });
        toast.success("запись обновлена успешно");
        setEditingId(null);
      } else {
        await createRecording(recordingData);
        toast.success("запись создана успешно");
        setIsCreating(false);
      }

      setFormData({
        programId: "",
        episodeTitle: "",
        description: "",
        type: "live",
        airDate: "",
        duration: undefined,
        status: "draft",
        keywords: "",
        genreIds: [],
        hosts: [],
        guests: [],
        audioFileId: undefined,
      });

      if (audioFileRef.current) {
        audioFileRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error.message || "Не удалось сохранить запись");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    if (audioFileRef.current) {
    }
    setFormData({
      programId: "",
      episodeTitle: "",
      description: "",
      type: "live",
      airDate: "",
      duration: undefined,
      status: "draft",
      keywords: "",
      genreIds: [],
      hosts: [],
      guests: [],
      audioFileId: undefined,
    });
    if (audioFileRef.current) {
      audioFileRef.current.value = "";
    }
  };

  const handleMultiSelect = (
    field: "genreIds" | "hosts" | "guests",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((id) => id !== value)
        : [...prev[field], value],
    }));
  };

  if (!programs || !people || !genres) {
    return <div className="p-6">загрузка данных...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            передача *
          </label>
          <select
            required
            value={formData.programId}
            onChange={(e) =>
              setFormData({ ...formData, programId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Выберите программу</option>
            {programs.map((program) => (
              <option key={program._id} value={program._id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            название выпуска *
          </label>
          <input
            type="text"
            required
            value={formData.episodeTitle}
            onChange={(e) =>
              setFormData({ ...formData, episodeTitle: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            тип *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as "live" | "podcast",
              })
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="live">прямой эфир</option>
            <option value="podcast">подкаст</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            дата выхода *
          </label>
          <input
            type="date"
            required
            value={formData.airDate}
            onChange={(e) =>
              setFormData({ ...formData, airDate: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            cтатус
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "draft" | "published" | "hidden",
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="draft">черновик</option>
            <option value="published">опубликовано</option>
            <option value="hidden">скрыто</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          аудиофайл (mp3) *
        </label>
        {!formData.audioFileId && (
          <input
            ref={audioFileRef}
            type="file"
            required
            accept=".mp3,audio/mpeg"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleFileUpload(file);
              }
            }}
            disabled={isUploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
        {isUploading && (
          <p className="text-sm text-primary/60 mt-1">загрузка файла...</p>
        )}
        {formData.audioFileId && (
          <p className="text-sm text-primary mt-1">✓ файл загружен</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ключевые слова
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) =>
            setFormData({ ...formData, keywords: e.target.value })
          }
          placeholder="ключевые слова через запятую"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            жанры
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
            {genres.map((genre) => (
              <label key={genre._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.genreIds.includes(genre._id)}
                  onChange={() => handleMultiSelect("genreIds", genre._id)}
                  className="mr-2"
                />
                <span className="text-sm">{genre.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ведущие
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
            {people.map((person) => (
              <label key={person._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hosts.includes(person._id)}
                  onChange={() => handleMultiSelect("hosts", person._id)}
                  disabled={formData.guests.includes(person._id)}
                  className="mr-2"
                />
                <span
                  className={`text-sm ${formData.guests.includes(person._id) ? "text-gray-400" : ""}`}
                >
                  {person.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            гости
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
            {people.map((person) => (
              <label key={person._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.guests.includes(person._id)}
                  onChange={() => handleMultiSelect("guests", person._id)}
                  disabled={formData.hosts.includes(person._id)}
                  className="mr-2"
                />
                <span
                  className={`text-sm ${formData.hosts.includes(person._id) ? "text-gray-400" : ""}`}
                >
                  {person.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={isUploading}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover disabled:opacity-50"
        >
          {editingId ? "обновить" : "создать"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
        >
          отмена
        </button>
        &nbsp;
        {isUploading && (
          <div className="rounded-full h-4 w-4 border-b-2 border-primary animate-spin "></div>
        )}
      </div>
    </form>
  );
}

interface RecordingFormData {
  programId: string;
  episodeTitle: string;
  description?: string;
  type: "live" | "podcast";
  airDate: string;
  duration?: number;
  status: "draft" | "published" | "hidden";
  keywords?: string;
  genreIds: string[];
  hosts: string[];
  guests: string[];
  audioFileId: Id<"_storage"> | undefined;
}
