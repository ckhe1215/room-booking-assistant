import { RoomsResponse } from "../remotes/queryOptions";

export const getFloors = (rooms: RoomsResponse[]) => {
  const floors = new Set(rooms.map((room) => room.floor));
  return Array.from(floors)
    .sort((a, b) => a - b)
    .map((floor) => ({
      label: `${floor}층`,
      value: String(floor),
    }));
};

export const getTimeOptions = ({ from, to }: { from: number; to: number }) => {
  const hours = Array.from({ length: to - from }, (_, i) => i + from);
  const minutes = [0, 30];
  const padStart = (num: number) => num.toString().padStart(2, "0");
  return hours
    .flatMap((hour) =>
      minutes.map((minute) => ({
        label: `${padStart(hour)}:${padStart(minute)}`,
        value: `${padStart(hour)}:${padStart(minute)}`,
      })),
    )
    .concat({
      label: `${padStart(to)}:00`,
      value: `${padStart(to)}:00`,
    });
};
