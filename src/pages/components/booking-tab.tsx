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
import { createReservations, getReservationsQueryOptions, getRoomsQueryOptions } from "@/src/remotes/queryOptions";
import { SuspenseQueries } from '@suspensive/react-query';
import { useQueryClient } from "@tanstack/react-query";
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

export function BookingTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get("date") || format(new Date(), 'yyyy-MM-dd');
  const { control, register, watch, handleSubmit, formState: { errors }, trigger } = useForm<BookingFormValues>({
    mode: "onChange",
    defaultValues: {
      date: new Date(),
      attendees: 1,
      start: "09:00",
      end: "10:00",
      equipments: [],
    },
  });
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const startTime = watch("start");

  useEffect(() => {
    trigger("end");
  }, [startTime, trigger]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <DateField label="날짜 선택" value={new Date(date)} onSelect={
            (date) => {
              setSearchParams(() => ({ date: format(date ?? new Date(), 'yyyy-MM-dd') }))
            }
          } />
          <SuspenseQueries queries={[getRoomsQueryOptions(), getReservationsQueryOptions(date)]}>
            {([{ data: rooms }, { data: reservations }]) => {
              return rooms.map((room) => {
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
              })
            }}
          </SuspenseQueries>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(async (data) => {
        if (!selectedRoom) {
          toast({
            title: "예약 실패",
            description: "회의실을 선택해주세요.",
          });
          return;
        }

        if (isAfter(parse(data.start, "HH:mm", new Date()), parse(data.end, "HH:mm", new Date()))) {
          toast({
            title: "예약 실패",
            description: "종료 시간이 시작 시간보다 늦어야합니다.",
          });
          return;
        }
        const res = await createReservations({
          roomId: selectedRoom,
          date: format(data.date, 'yyyy-MM-dd'),
          start: data.start,
          end: data.end,
          attendees: data.attendees,
          equipments: data.equipments,
        });

        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["reservations", date] });
          toast({
            title: "예약 완료",
            description: "예약이 완료되었습니다.",
          });
        }
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
                <SelectField label="시작 시간" options={[{
                  label: "09:00",
                  value: "09:00"
                }, {
                  label: "10:00",
                  value: "10:00"
                }, {
                  label: "17:00",
                  value: "17:00" // TODO: 실제 값 넣기
                }]}
                  value={field.value}
                  onValueChange={field.onChange} />
              )}
            />
            <Controller
              name="end"
              control={control}
              rules={{
                validate: (value) => {
                  const start = parse(watch("start"), "HH:mm", new Date());
                  const end = parse(value, "HH:mm", new Date());

                  return isAfter(end, start) || "종료 시간은 시작 시간 이후이어야 합니다.";
                }
              }}
              render={({ field }) => (
                <SelectField label="종료 시간" options={[{
                  label: "09:00",
                  value: "09:00"
                }, {
                  label: "10:00",
                  value: "10:00"
                }, {
                  label: "17:00",
                  value: "17:00" // TODO: 실제 값 넣기
                }]}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            {errors.end && <p className="text-red-500">종료 시간은 시작 시간 이후이어야 합니다.</p>}
            <Controller
              name="floor"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="선호 층 (선택)"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { label: "1", value: "1" },
                    { label: "2", value: "2" },
                    { label: "3", value: "3" }, // TODO: 실제 값 넣기
                  ]}
                />
              )}
            />

            <div className="space-y-2">
              <Label>필요 장비</Label>
              <Controller
                name="equipments"
                control={control}
                render={({ field }) => (
                  <ToggleGroup type="multiple" variant="outline" spacing={2} size="sm" value={field.value} onValueChange={field.onChange}>
                    <ToggleGroupItem value="tv">
                      <Tv className="h-4 w-4" />
                      TV
                    </ToggleGroupItem>
                    <ToggleGroupItem value="whiteboard">
                      <Presentation className="h-4 w-4" />
                      화이트보드
                    </ToggleGroupItem>
                    <ToggleGroupItem value="video">
                      <Video className="h-4 w-4" />
                      화상회의
                    </ToggleGroupItem>
                    <ToggleGroupItem value="speaker">
                      <Volume2 className="h-4 w-4" />
                      스피커
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>예약 가능한 회의실</CardTitle>
          </CardHeader>
          <CardContent>
            <SuspenseQueries queries={[getRoomsQueryOptions(), getReservationsQueryOptions(date)]}>
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
                  const date = watch("date");
                  const start = watch("start");
                  const end = watch("end");
                  return !reservations.some((reservation) => reservation.date === format(date, "yyyy-MM-dd") && reservation.roomId === room.id && reservation.start < end && reservation.end > start);
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

            <Button size="lg" type="submit">예약하기</Button>
          </CardContent>
        </Card>
      </form>

    </div >
  );
}
