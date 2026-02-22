type RoomsResponse = {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipment: ("tv" | "whiteboard" | "video" | "speaker")[];
};

export const getRoomsQueryOptions = () => {
  return {
    queryKey: ["rooms"],
    queryFn: (): Promise<RoomsResponse[]> => fetch("/api/rooms").then((res) => res.json()),
  };
};

type ReservationsResponse = {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  attendees: number;
  equipment: ("tv" | "whiteboard" | "video" | "speaker")[];
};

export const getReservationsQueryOptions = (date: string) => {
  return {
    queryKey: ["reservations", date],
    queryFn: (): Promise<ReservationsResponse[]> => fetch(`/api/reservations?date=${date}`).then((res) => res.json()),
  };
};
