import { Building2, Globe, Clock, Languages, Upload } from "lucide-react";

// ─── Section: GeneralOrgInfoSection ────────────────────────────────────────────────────
export const GeneralOrgInfo = () => {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Account info</h2>
        <p className="text-sm text-gray-500 mt-0.5"></p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              A
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Upload size={15} />
              Upload logo
            </button>
          </div>
        </div>

        {/* Org name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Building2 size={14} className="inline mr-1.5 text-gray-400" />
            Organization name
          </label>
          <input
            type="text"
            defaultValue="AXORA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Globe size={14} className="inline mr-1.5 text-gray-400" />
            Website
          </label>
          <input
            type="url"
            defaultValue="https://axora.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Clock size={14} className="inline mr-1.5 text-gray-400" />
            Timezone
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>(UTC-08:00) Pacific Time</option>
            <option>(UTC-05:00) Eastern Time</option>
            <option>(UTC+00:00) UTC</option>
            <option>(UTC+01:00) Central European Time</option>
            <option>(UTC+05:30) India Standard Time</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Languages size={14} className="inline mr-1.5 text-gray-400" />
            Default language
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Arabic</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Save changes
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
