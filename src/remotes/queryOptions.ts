export type RoomsResponse = {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[];
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
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[];
};

export const getReservationsQueryOptions = (date: string) => {
  return {
    queryKey: ["reservations", date],
    queryFn: (): Promise<ReservationsResponse[]> => fetch(`/api/reservations?date=${date}`).then((res) => res.json()),
  };
};

export type MyReservationsResponse = {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  attendees: number;
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[];
};

export const getMyReservationsQueryOptions = () => {
  return {
    queryKey: ["my-reservations"],
    queryFn: (): Promise<MyReservationsResponse[]> => fetch("/api/my-reservations").then((res) => res.json()),
  };
};

type Reservation = {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  attendees: number;
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[];
  userId: string;
};

export type CreateReservationRequest = {
  roomId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  attendees: number;
  equipments: ("tv" | "whiteboard" | "video" | "speaker")[];
};

export type CreateReservationResponse =
  | {
      ok: true;
      reservation: Reservation;
    }
  | {
      ok: false;
      code: "CONFLICT" | "INVALID" | "NOT_FOUND";
      message: string;
    };

export const createReservations = (request: CreateReservationRequest): Promise<CreateReservationResponse> => {
  return fetch("/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  }).then((res) => res.json());
};

export const cancelReservation = (id: string) => {
  return fetch(`/api/reservations/${id}`, {
    method: "DELETE",
  }).then((res) => res.json());
};
