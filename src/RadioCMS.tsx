import { useState } from "react";
import { ProgramsManager } from "./components/ProgramsManager";
import { PeopleManager } from "./components/PeopleManager";
import { RecordingsManager } from "./components/RecordingsManager";
import { GenresManager } from "./components/GenresManager";

type Tab = "programs" | "people" | "recordings" | "genres";

export function RadioCMS() {
  const [activeTab, setActiveTab] = useState<Tab>("programs");

  const tabs = [
    { id: "programs" as Tab, label: "передачи", icon: "📻" },
    { id: "people" as Tab, label: "люди", icon: "👥" },
    { id: "recordings" as Tab, label: "файлы", icon: "🎙️" },
    { id: "genres" as Tab, label: "жанры", icon: "🏷️" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary hover:text-secondary-hover hover:border-secondary-hover"
              }`}
            >
              {/* <span className="mr-2">{tab.icon}</span> */}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="mt-6">
          <div className={activeTab === "programs" ? "block" : "hidden"}>
            <ProgramsManager />
          </div>
          <div className={activeTab === "people" ? "block" : "hidden"}>
            <PeopleManager />
          </div>
          <div className={activeTab === "recordings" ? "block" : "hidden"}>
            <RecordingsManager />
          </div>
          <div className={activeTab === "genres" ? "block" : "hidden"}>
            <GenresManager />
          </div>
        </div>
      </div>
    </div>
  );
}
