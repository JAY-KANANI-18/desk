import {
  createContext,
  useContext,
  useEffect,
  type DependencyList,
  type ReactNode,
} from "react";

export type MobileHeaderAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  hasIndicator?: boolean;
};

export type MobileHeaderRegistration = {
  actions?: MobileHeaderAction[];
  panel?: ReactNode;
};

type MobileHeaderActionsContextValue = {
  registration: MobileHeaderRegistration;
  setRegistration: (registration: MobileHeaderRegistration) => void;
  clearRegistration: () => void;
};

const noop = () => {};

export const MobileHeaderActionsContext =
  createContext<MobileHeaderActionsContextValue>({
    registration: {},
    setRegistration: noop,
    clearRegistration: noop,
  });

export function useMobileHeaderActions(
  registration: MobileHeaderRegistration,
  deps: DependencyList,
) {
  const { setRegistration, clearRegistration } = useContext(
    MobileHeaderActionsContext,
  );

  useEffect(() => {
    setRegistration(registration);
    return clearRegistration;
    // The caller controls when the registration should be refreshed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useMobileHeaderActionState() {
  return useContext(MobileHeaderActionsContext);
}

export function MobileHeaderActionButtons({
  actions = [],
}: {
  actions?: MobileHeaderAction[];
}) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      {actions.map((action) => (
        <button
          aria-label={action.label}
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${
            action.active ? "bg-slate-100 text-indigo-600" : ""
          }`}
          disabled={action.disabled}
          key={action.id}
          onClick={action.onClick}
          type="button"
        >
          {action.hasIndicator ? (
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white"
            />
          ) : null}
          {action.icon}
        </button>
      ))}
    </div>
  );
}
