import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Edit, Trash } from "lucide-react";

export function PeopleManager() {
  const people = useQuery(api.people.list);
  const createPerson = useMutation(api.people.create);
  const updatePerson = useMutation(api.people.update);
  const deletePerson = useMutation(api.people.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"people"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    telegramAccount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Process telegram account - remove @ if present, we'll add it back
      const telegramAccount = formData.telegramAccount.replace(/^@/, "");

      if (editingId) {
        await updatePerson({
          id: editingId,
          name: formData.name,
          telegramAccount: telegramAccount || undefined,
        });
        toast.success("обновили");
        setEditingId(null);
        setIsCreating(false);
      } else {
        await createPerson({
          name: formData.name,
          telegramAccount: telegramAccount || undefined,
        });
        toast.success("добавили");
        setIsCreating(false);
      }
      setFormData({ name: "", telegramAccount: "" });
    } catch (error) {
      console.log(error);
      toast.error("не удалось сохранить изменения");
    }
  };

  const handleEdit = (person: any) => {
    setEditingId(person._id);
    setFormData({
      name: person.name,
      telegramAccount: person.telegramAccount || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: Id<"people">) => {
    if (confirm("вы уверены, что хотите удалить этого человека?")) {
      try {
        await deletePerson({ id });
        toast.success("человек удален");
      } catch (error) {
        console.log(error);
        toast.error("не удалось удалить человека");
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: "", telegramAccount: "" });
  };

  const getTelegramUrl = (username: string) => {
    return `https://t.me/${username}`;
  };

  if (!people) {
    return <div className="p-6">загрузка людей...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">люди (ведущие и гости)</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
          >
            добавить человека
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? "редактор" : "добавить ведущего или гостя"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                имя *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                аккаунт в телеграме
              </label>
              <input
                type="text"
                value={formData.telegramAccount}
                onChange={(e) =>
                  setFormData({ ...formData, telegramAccount: e.target.value })
                }
                placeholder="username (без @)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
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
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map((person) => (
          <div key={person._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">{person.name}</h3>
              <div className="flex space-x-3 ml-4">
                <button
                  onClick={() => handleEdit(person)}
                  className="text-primary hover:text-primary-hover/80 text-sm"
                >
                  <Edit />
                </button>
                <button
                  onClick={() => handleDelete(person._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  <Trash />
                </button>
              </div>
            </div>
            {person.telegramAccount && (
              <p className="text-gray-600 text-sm">
                <a
                  href={getTelegramUrl(person.telegramAccount)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover/80"
                >
                  @{person.telegramAccount}
                </a>
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              добавлен:{" "}
              {new Date(person._creationTime).toLocaleDateString("ru-RU")}
            </p>
          </div>
        ))}
        {people.length === 0 && (
          <div className="col-span-full">
            <p className="text-secondary text-center py-8">
              добавьте своего первого ведущего или гостя!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
