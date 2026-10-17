"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

type CalendarDay = {
  dateKey: string;
  weekday: string;
  dayNumber: string;
};

type CalendarShift = {
  id: string;
  dateKey: string;
  zoneId: string;
  zoneName: string;
  zoneColor: string;
  startLabel: string;
  endLabel: string;
  status: string;
  requestStatus: string | null;
  available: boolean;
};

type Props = {
  days: CalendarDay[];
  shifts: CalendarShift[];
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function PublicShiftCalendar({ days, shifts }: Props) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const timeSlots = useMemo(() => {
    const slots = new Map<string, { startLabel: string; endLabel: string }>();
    for (const shift of shifts) {
      const key = `${shift.startLabel}-${shift.endLabel}`;
      slots.set(key, { startLabel: shift.startLabel, endLabel: shift.endLabel });
    }
    return Array.from(slots, ([key, slot]) => ({ key, ...slot })).sort((first, second) =>
      timeToMinutes(first.startLabel) - timeToMinutes(second.startLabel),
    );
  }, [shifts]);

  return (
    <Box sx={{ overflowX: "auto", border: "1px solid var(--app-border)" }} role="region" aria-label="Calendario semanal de turnos" tabIndex={0}>
      <Box
        role="grid"
        aria-label="Turnos por día y horario"
        sx={{
          display: "grid",
          gridTemplateColumns: `72px repeat(${days.length}, minmax(142px, 1fr))`,
          minWidth: `${72 + days.length * 142}px`,
        }}
      >
        <Box role="row" sx={{ display: "contents" }}>
          <Box role="columnheader" sx={{ p: 0.75, borderBottom: "1px solid var(--app-border)", backgroundColor: "var(--app-surface-muted)" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750 }}>HORA</Typography>
          </Box>
          {days.map((day) => (
            <Box key={day.dateKey} role="columnheader" sx={{ p: 1.25, borderLeft: "1px solid var(--app-border)", borderBottom: "1px solid var(--app-border)", backgroundColor: "var(--app-surface-muted)" }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>{day.weekday}</Typography>
              <Typography variant="h6" sx={{ mt: 0.25 }}>{day.dayNumber}</Typography>
            </Box>
          ))}
        </Box>

        {timeSlots.map((slot) => (
          <Box key={slot.key} role="row" sx={{ display: "contents" }}>
            <Box role="rowheader" sx={{ p: 0.75, borderBottom: "1px solid var(--app-border)", backgroundColor: "var(--app-surface-muted)" }}>
              <Typography variant="caption" sx={{ fontWeight: 750, whiteSpace: "nowrap" }}>{slot.startLabel}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "nowrap" }}>{slot.endLabel}</Typography>
            </Box>
            {days.map((day) => {
              const matchingShifts = shifts.filter((shift) =>
                shift.dateKey === day.dateKey &&
                shift.startLabel === slot.startLabel &&
                shift.endLabel === slot.endLabel,
              );
              const availableShifts = matchingShifts.filter((shift) => shift.available);
              const takenCount = matchingShifts.filter((shift) => shift.status === "FULL").length;
              const personalCount = matchingShifts.filter((shift) => shift.status === "OPEN" && !shift.available).length;
              const unavailableLabel = matchingShifts.some((shift) => shift.requestStatus === "PENDING")
                ? "Solicitud pendiente"
                : matchingShifts.some((shift) => shift.requestStatus === "CONFIRMED")
                  ? "Ya asignado"
                  : "Todo tomado";
              const slotId = `${day.dateKey}-${slot.key}`;
              const isExpanded = expandedSlot === slotId;

              return (
                <Box key={`${day.dateKey}-${slot.key}`} role="gridcell" sx={{ minWidth: 0, minHeight: 76, p: 0.75, borderLeft: "1px solid var(--app-border)", borderBottom: "1px solid var(--app-border)" }}>
                  {matchingShifts.length === 0 ? (
                    <Box aria-hidden="true" sx={{ height: "100%", minHeight: 60 }} />
                  ) : availableShifts.length === 0 ? (
                    <Box aria-label={unavailableLabel} sx={{ minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", p: 1, backgroundColor: "action.disabledBackground", opacity: 0.46, color: "text.secondary" }}>
                      <Stack spacing={0.25} sx={{ textAlign: "center" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{unavailableLabel}</Typography>
                        {takenCount > 0 ? <Typography variant="caption">{takenCount} {takenCount === 1 ? "lugar" : "lugares"}</Typography> : null}
                      </Stack>
                    </Box>
                  ) : (
                    <Stack spacing={0.75}>
                      <ButtonBase
                        onClick={() => setExpandedSlot(isExpanded ? null : slotId)}
                        aria-expanded={isExpanded}
                        aria-controls={`places-${slotId}`}
                        sx={{
                          width: "100%",
                          minHeight: 60,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 0.75,
                          p: 1,
                          textAlign: "left",
                          border: "1px solid",
                          borderColor: "success.main",
                          backgroundColor: "color-mix(in srgb, var(--app-success, #2e7d32) 8%, var(--app-surface))",
                          color: "var(--app-ink)",
                          "&:hover": { backgroundColor: "color-mix(in srgb, var(--app-success, #2e7d32) 14%, var(--app-surface))" },
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: "success.dark" }}>
                            {availableShifts.length} {availableShifts.length === 1 ? "lugar disponible" : "lugares disponibles"}
                          </Typography>
                          {takenCount > 0 ? <Typography variant="caption" color="text.secondary">{takenCount} tomados</Typography> : null}
                          {personalCount > 0 ? <Typography variant="caption" color="text.secondary">{personalCount} en tus solicitudes</Typography> : null}
                        </Box>
                        <ExpandMoreRoundedIcon sx={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 120ms ease" }} />
                      </ButtonBase>
                      {isExpanded ? (
                        <Stack id={`places-${slotId}`} spacing={0.5}>
                          {availableShifts.map((shift) => (
                            <Link
                              key={shift.id}
                              href={`/solicitar?selectedDate=${day.dateKey}&zoneId=${shift.zoneId}&shiftId=${shift.id}`}
                              style={{
                                display: "block",
                                padding: "8px 9px",
                                border: `1px solid ${shift.zoneColor}`,
                                borderLeft: `4px solid ${shift.zoneColor}`,
                                background: `color-mix(in srgb, ${shift.zoneColor} 24%, var(--app-surface))`,
                                color: "var(--app-ink)",
                                textDecoration: "none",
                                fontSize: "0.78rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {shift.zoneName}
                            </Link>
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
