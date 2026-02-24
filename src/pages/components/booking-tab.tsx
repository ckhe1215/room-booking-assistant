import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation, Tv, Video, Volume2 } from "lucide-react";

import { DateField } from "@/components/date-field";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SubCard, SubCardContent, SubCardHeader } from "@/components/ui/sub-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";
import { createReservations, getReservationsQueryOptions, getRoomsQueryOptions, RoomsResponse } from "@/src/remotes/queryOptions";
import { SuspenseQueries, SuspenseQuery } from '@suspensive/react-query';
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, parse } from "date-fns";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { RoomSelect } from "./room-select";

type BookingFormValues = {
  date: Date;
  attendees: number;
  start: string;
  end: string;
  floor?: string;
  equipments: ('tv' | 'whiteboard' | 'video' | 'speaker')[];
}

const DEFAULT_FORM_VALUES: BookingFormValues = {
  date: new Date(),
  attendees: 1,
  start: "9:00",
  end: "10:00",
  equipments: [],
}

export function BookingTab() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || format(new Date(), 'yyyy-MM-dd');

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const { control, register, watch, handleSubmit, formState: { errors }, trigger } = useForm<BookingFormValues>({
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    trigger("end");
  }, [watch("start"), trigger]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <DateField label="날짜 선택" value={new Date(dateParam)} onSelect={
            (date) => {
              setSearchParams({ date: format(date ?? new Date(), 'yyyy-MM-dd') })
            }
          } />
          <SuspenseQueries queries={[getRoomsQueryOptions(), getReservationsQueryOptions(dateParam)]}>
            {([{ data: rooms }, { data: reservations }]) => rooms.map((room) => {
              const currentRoomReservations = reservations.filter((reservation) => reservation.roomId === room.id);
              return (
                <SubCard>
                  <SubCardHeader>{room.name}</SubCardHeader>
                  <SubCardContent>
                    {currentRoomReservations.length === 0 ? (
                      <p className="text-muted-foreground text-sm">예약 없음</p>
                    ) : (
                      currentRoomReservations.map((reservation) => (
                        <Badge variant="outline">{reservation.start} - {reservation.end}</Badge>
                      ))
                    )}
                  </SubCardContent>
                </SubCard>
              )
            })}
          </SuspenseQueries>
        </CardContent>
      </Card>

      <form id="reservation-form" onSubmit={handleSubmit((data) => {
        if (!selectedRoom) {
          toast({
            title: "예약 실패",
            description: "회의실을 선택해주세요.",
          });
          return;
        }
        if (validateStartEndTime(data.start, data.end)) {
          toast({
            title: "예약 실패",
            description: "종료 시간이 시작 시간보다 늦어야합니다.",
          });
          return;
        }
        handleCreateReservation(data, selectedRoom, queryClient);
      })}>
        <Card>
          <CardHeader>
            <CardTitle>예약 조건</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateField label="날짜" value={field.value} onSelect={field.onChange} />
              )}
            />
            <InputField label="참석 인원" placeholder="1" type="number" {...register("attendees", { min: 1 })} />
            {errors.attendees && <p className="text-red-500">참석 인원은 최소 한 명 이상이어야 합니다.</p>}
            <Controller
              name="start"
              control={control}
              render={({ field }) => (
                <SelectField label="시작 시간" options={getTimeOptions({ from: 9, to: 20 })}
                  value={field.value}
                  onValueChange={field.onChange} />
              )}
            />
            <Controller
              name="end"
              control={control}
              rules={{
                validate: (value) => !validateStartEndTime(watch("start"), value) || "종료 시간은 시작 시간 이후이어야 합니다."
              }}
              render={({ field }) => (
                <SelectField label="종료 시간" options={getTimeOptions({ from: 9, to: 20 })}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            {errors.end && <p className="text-red-500">{errors.end.message}</p>}
            <Controller
              name="floor"
              control={control}
              render={({ field }) => (
                <SuspenseQuery {...getRoomsQueryOptions()}>
                  {({ data }) =>
                    <SelectField
                      label="선호 층 (선택)"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={getFloors(data)}
                    />
                  }
                </SuspenseQuery>

              )}
            />
            <div className="space-y-2">
              <Label>필요 장비</Label>
              <Controller
                name="equipments"
                control={control}
                render={({ field }) => (
                  <ToggleGroup type="multiple" variant="outline" spacing={2} size="sm" value={field.value} onValueChange={field.onChange}>
                    {[
                      { label: "TV", value: "tv", icon: <Tv className="h-4 w-4" /> },
                      { label: "화이트보드", value: "whiteboard", icon: <Presentation className="h-4 w-4" /> },
                      { label: "화상회의", value: "video", icon: <Video className="h-4 w-4" /> },
                      { label: "스피커", value: "speaker", icon: <Volume2 className="h-4 w-4" /> }
                    ].map((item) => (
                      <ToggleGroupItem key={item.value} value={item.value}>
                        {item.icon}
                        {item.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </form>



      <Card>
        <CardHeader>
          <CardTitle>예약 가능한 회의실</CardTitle>
        </CardHeader>
        <CardContent>
          <SuspenseQueries queries={[getRoomsQueryOptions(), getReservationsQueryOptions(format(watch("date"), "yyyy-MM-dd"))]}>
            {([{ data: rooms }, { data: reservations }]) => {
              const filteredRooms = rooms.filter((room) => {
                return room.capacity >= watch("attendees");
              }).filter((room) => {
                const requiredEquipments = watch("equipments");
                return requiredEquipments.every((equipment) => room.equipments.includes(equipment));
              }).filter((room) => {
                const preferredFloor = watch("floor");
                return preferredFloor ? room.floor === Number(preferredFloor) : true;
              });
              const availableRooms = filteredRooms.filter((room) => {
                const start = parse(watch("start"), "HH:mm", new Date());
                const end = parse(watch("end"), "HH:mm", new Date());
                return !reservations.some((reservation) => reservation.roomId === room.id && isAfter(end, parse(reservation.start, "HH:mm", new Date())) && isAfter(parse(reservation.end, "HH:mm", new Date()), start));
              });

              return <>
                {availableRooms.map((room) => (
                  <RoomSelect key={room.id} selected={room.id === selectedRoom} onSelect={() => {
                    setSelectedRoom(room.id);
                  }} name={room.name} floor={room.floor} capacity={room.capacity} equipments={room.equipments} />
                ))}
              </>
            }}
          </SuspenseQueries>

          <Button size="lg" type="submit" form="reservation-form">예약하기</Button>
        </CardContent>
      </Card>

    </div >
  );
}

export const getFloors = (rooms: RoomsResponse[]) => {
  const floors = new Set(rooms.map((room) => room.floor));
  return Array.from(floors).sort((a, b) => a - b).map((floor) => ({
    label: `${floor}층`,
    value: String(floor),
  }));
}

export const getTimeOptions = ({ from, to }: { from: number; to: number }) => {
  const hours = Array.from({ length: to - from }, (_, i) => i + from);
  const minutes = [0, 30];
  return hours.flatMap((hour) => minutes.map((minute) => ({
    label: `${hour}:${minute < 10 ? "0" : ""}${minute}`,
    value: `${hour}:${minute < 10 ? "0" : ""}${minute}`,
  }))).concat({
    label: `${to}:00`,
    value: `${to}:00`,
  });
}

const handleCreateReservation = async (data: BookingFormValues, selectedRoom: string, queryClient: QueryClient) => {
  const res = await createReservations({
    roomId: selectedRoom,
    date: format(data.date, 'yyyy-MM-dd'),
    start: data.start,
    end: data.end,
    attendees: data.attendees,
    equipments: data.equipments,
  });

  if (res.ok) {
    queryClient.invalidateQueries({ queryKey: ["reservations", format(data.date, "yyyy-MM-dd")] });
    toast({
      title: "예약 완료",
      description: "예약이 완료되었습니다.",
    });
  }
}

const validateStartEndTime = (start: string, end: string) => {
  const startTime = parse(start, "HH:mm", new Date());
  const endTime = parse(end, "HH:mm", new Date());
  return isAfter(startTime, endTime);
}