export type DateBlock = {
  startDate: Date | string;
  endDate: Date | string;
  excludedShiftIds?: readonly string[];
};

const dateKey = (value: Date | string) => typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);

export function blockAppliesToShift(shiftId: string, date: Date | string, block: DateBlock) {
  const target = dateKey(date);
  return !block.excludedShiftIds?.includes(shiftId) && dateKey(block.startDate) <= target && dateKey(block.endDate) >= target;
}
