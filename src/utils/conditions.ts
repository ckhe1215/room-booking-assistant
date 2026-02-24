import { isAfter, isSameMinute, parse } from "date-fns";
import { ReservationsResponse, RoomsResponse } from "../remotes/queryOptions";

export const validateStartEndTime = (start: string, end: string) => {
  const startTime = parseHHmm(start);
  const endTime = parseHHmm(end);
  return isAfter(startTime, endTime) || isSameMinute(startTime, endTime);
};

export const isEnoughCapacity = (room: RoomsResponse, attendees: number) => {
  return room.capacity >= attendees;
};
export const hasRequiredEquipments = (
  room: RoomsResponse,
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[],
) => {
  return equipments.every((equipment) => room.equipments.includes(equipment));
};
export const isPreferredFloor = (room: RoomsResponse, preferredFloor?: string) => {
  return preferredFloor ? room.floor === Number(preferredFloor) : true;
};

export const isDuplicateReservation = (reservation: ReservationsResponse, start: string, end: string) => {
  return isAfter(parseHHmm(end), parseHHmm(reservation.start)) && isAfter(parseHHmm(reservation.end), parseHHmm(start));
};

const parseHHmm = (time: string) => parse(time, "HH:mm", new Date());
