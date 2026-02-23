import { Calendar } from "@/components/ui/calendar";
import { cancelReservation, getMyReservationsQueryOptions } from "@/src/remotes/queryOptions";
import { SuspenseQuery } from "@suspensive/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { ReservationCard } from "./reservation-card";

export function MyReservationsTab() {
  const queryClient = useQueryClient();

  return (
    <SuspenseQuery {...getMyReservationsQueryOptions()}>
      {({ data }) => {
        if (data.length === 0) {
          return <div className="text-muted-foreground py-20 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>예약 내역이 없습니다.</p>
            <p className="mt-2 text-xs">예약 조회/취소 로직을 구현해보세요.</p>
          </div>
        }
        return (
          <div className="space-y-4">
            {data.map((item) =>
              <ReservationCard
                key={item.id}
                name={item.roomId}
                date={item.date}
                startTime={item.start}
                endTime={item.end}
                capacity={item.attendees}
                equipments={item.equipments}
                onCancel={async () => {
                  const response = await cancelReservation(item.id);
                  if (response.ok) {
                    queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
                  }
                }}
              />)
            }
          </div>
        )
      }}
    </SuspenseQuery >
  );
}
