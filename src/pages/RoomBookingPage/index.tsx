import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingTab } from "@/src/pages/components/booking-tab";
import { MyReservationsTab } from "@/src/pages/components/my-reservations-tab";
import { PropsWithChildren } from "react";

export function RoomBookingPage() {

  return (
    <>
      <Title>회의실 예약</Title>
      <Tabs defaultValue="booking">
        <TabsList className="mb-6">
          <TabsTrigger value="booking">예약하기</TabsTrigger>
          <TabsTrigger value="my-reservations">내 예약</TabsTrigger>
        </TabsList>

        <TabsContent value="booking">
          <BookingTab />
        </TabsContent>

        <TabsContent value="my-reservations">
          <MyReservationsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Title({ children }: PropsWithChildren) {
  return <h1 className="text-foreground mb-8 text-3xl font-bold">{children}</h1>;
}
