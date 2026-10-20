export function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone || !/^[+\d\s().-]+$/.test(phone.trim())) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Chilean mobile numbers are commonly stored without the country code.
  if (/^9\d{8}$/.test(digits)) digits = `56${digits}`;
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function formatChileanMobilePhone(phone: string | null | undefined) {
  if (!phone || !/^[+\d\s().-]+$/.test(phone.trim())) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0?9\d{8}$/.test(digits)) digits = `56${digits.replace(/^0/, "")}`;
  if (!/^569\d{8}$/.test(digits)) return null;
  return `+56 9 ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

export function assignmentNotice(status: string) {
  if (status === "CANCELLED") return "El administrador canceló tu asignación";
  if (status === "REPLACED") return "El administrador reemplazó tu asignación; esta pareja ya no está confirmada";
  return "El administrador confirmó tu asignación";
}

export function buildAssignmentWhatsAppLink(input: {
  phone: string | null;
  name: string;
  partner: string;
  status: string;
  zone: string;
  date: string;
  time: string;
  siteUrl: string;
}) {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone) return null;
  const message = `Hola, ${input.name}. ${assignmentNotice(input.status)}.\nLugar: ${input.zone}\nFecha: ${input.date}\nHorario: ${input.time}\nPareja de esta asignación: ${input.partner}\nRevisa el estado actual en Mis turnos: ${new URL("/asignaciones", input.siteUrl)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildRelocationWhatsAppLink(input: {
  phone: string | null;
  name: string;
  sourceZone: string;
  targetZone: string;
  date: string;
  time: string;
}) {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone) return null;
  const message = `Hola, ${input.name}. Solicitaste un turno en ${input.sourceZone} el ${input.date}, de ${input.time}. ¿Aceptarías cambiar el lugar a ${input.targetZone}, manteniendo el mismo día y horario?\nPor favor, confirma por este chat si aceptas el cambio. La asignación quedará pendiente hasta que recibamos tu respuesta y la confirme el administrador.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
