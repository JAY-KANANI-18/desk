import { CreditCard, Download, CheckCircle } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";

// ─── Section: Billing & Usage ─────────────────────────────────────────────────
export const INVOICES = [
  { id: 1, date: "Jan 2026", amount: "$99.00", status: "Paid" },
  { id: 2, date: "Dec 2025", amount: "$99.00", status: "Paid" },
  { id: 3, date: "Nov 2025", amount: "$99.00", status: "Paid" },
];
export const BillingUsage = () => {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          Billing & usage
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          View your plan, usage, and billing history.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Current plan */}
        <div className="border border-gray-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Current plan
            </p>
            <p className="text-lg font-semibold text-gray-900">Growth</p>
            <p className="text-sm text-gray-500 mt-0.5">Trial ends in 4 days</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">$99</p>
            <p className="text-xs text-gray-500">per month</p>
            <Button >
              Upgrade now
            </Button>
          </div>
        </div>

        {/* Usage */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Monthly Active Contacts (MACs)
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>1 used</span>
            <span>1,000 limit</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: "0.1%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Resets on Feb 1, 2026</p>
        </div>

        {/* Payment method */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Payment method
          </p>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
            <CreditCard size={20} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/2026</p>
            </div>
          </div>
          <Button variant="link" size="sm">
            Update payment method
          </Button>
        </div>

        {/* Billing history */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Billing history
          </p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">
                  Date
                </th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">
                  Amount
                </th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">
                  Status
                </th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 text-sm text-gray-700">{inv.date}</td>
                  <td className="py-3 text-sm font-medium text-gray-800">
                    {inv.amount}
                  </td>
                  <td className="py-3">
                    <Tag
                      label={inv.status}
                      bgColor="success"
                      size="sm"
                      icon={<CheckCircle size={12} />}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="link"
                      size="xs"
                      leftIcon={<Download size={12} />}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
