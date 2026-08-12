"use client";

import { useEffect, useState } from "react";
import { PublicPersonPicker } from "@/components/public/public-person-picker";
import { ShiftRequestFlow } from "@/components/public/shift-request-flow";
import { startPublicSessionAction } from "@/features/public/actions";

type Person = { id: string; label: string };
type FlowData = {
  zones: Array<{ id: string; name: string }>;
  shifts: Array<{
    id: string; zoneId: string; zoneName: string; dateLabel: string; startLabel: string; endLabel: string;
    status: string; ownLatestRequest: { status: string } | null; publicAssignments: Array<{ id: string; label: string }>;
  }>;
  partners: Array<{ id: string; label: string }>;
  from: string;
  to: string;
  maintenanceModeEnabled: boolean;
};

export function PublicRequestJourney({ people }: { people: Person[] }) {
  const [flow, setFlow] = useState<FlowData | null>(null);

  useEffect(() => {
    const resetJourney = () => setFlow(null);
    window.addEventListener("public-session-ending", resetJourney);
    return () => window.removeEventListener("public-session-ending", resetJourney);
  }, []);

  if (flow) {
    return <ShiftRequestFlow zones={flow.zones} shifts={flow.shifts} partners={flow.partners} initialZoneId="" from={flow.from} to={flow.to} maintenanceModeEnabled={flow.maintenanceModeEnabled} requestError="" />;
  }

  return (
    <PublicPersonPicker
      people={people}
      selectedPersonId=""
      onContinue={async (personId) => {
        const result = await startPublicSessionAction(personId);
        if (!result.ok) {
          throw new Error(result.message);
        }
        setFlow(result);
      }}
    />
  );
}
