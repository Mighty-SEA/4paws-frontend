"use client";

import * as React from "react";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Booking {
  id: number;
  createdTime: string;
  serviceName: string;
  status: string;
}

export function CalendarButton() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [open, setOpen] = React.useState(false);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [bookedDates, setBookedDates] = React.useState<Set<string>>(new Set());

  const fetchBookings = React.useCallback(async (selectedDate: Date) => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings?page=1&pageSize=100");
      const data = await response.json();

      if (data.items) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const onlyPending: Booking[] = data.items
          .filter((b: any) => {
            const bookingDate = format(new Date(b.createdAt), "yyyy-MM-dd");
            return bookingDate === dateStr && String(b.status).toUpperCase() === "PENDING";
          })
          .map((b: any) => {
            const dt = new Date(b.createdAt);
            const hh = String(dt.getHours()).padStart(2, "0");
            const mm = String(dt.getMinutes()).padStart(2, "0");
            return {
              id: b.id,
              createdTime: `${hh}.${mm}`,
              serviceName: b?.serviceType?.service?.name ?? b?.serviceType?.name ?? "-",
              status: b.status,
            } as Booking;
          })
          .sort((a: Booking, b: Booking) => a.createdTime.localeCompare(b.createdTime));
        setBookings(onlyPending);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchBookings(date);
    }
  }, [open, date, fetchBookings]);

  const fetchMonthBookings = React.useCallback(async (monthDate: Date) => {
    try {
      const response = await fetch("/api/bookings?page=1&pageSize=500");
      const data = await response.json();
      const set = new Set<string>();
      if (data.items) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        for (const b of data.items as any[]) {
          // Hanya tandai tanggal yang memiliki booking PENDING
          if (String(b.status).toUpperCase() !== "PENDING") continue;
          const created = new Date(b.createdAt);
          if (created.getFullYear() === year && created.getMonth() === month) {
            const y = created.getFullYear();
            const m = String(created.getMonth() + 1).padStart(2, "0");
            const d = String(created.getDate()).padStart(2, "0");
            set.add(`${y}-${m}-${d}`);
          }
        }
      }
      setBookedDates(set);
    } catch {
      setBookedDates(new Set());
    }
  }, []);

  React.useEffect(() => {
    if (open) fetchMonthBookings(currentMonth);
  }, [open, currentMonth, fetchMonthBookings]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      fetchBookings(newDate);
    }
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-accent/50 relative" title="Kalender">
          <CalendarIcon className="size-4" />
          <span className="sr-only">Buka Kalender</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[55vh] w-[96vw] overflow-hidden p-0 sm:max-w-none md:max-w-[1300px]">
        <div className="grid h-[70vh] grid-cols-1 gap-0 md:grid-cols-[500px_1fr]">
          {/* Left Side - Calendar */}
          <div className="overflow-auto border-r p-6">
            <h3 className="mb-4 text-lg font-semibold">Pilih Tanggal</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              locale={id}
              className="rounded-md [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)]"
              modifiers={{
                booked: (d) => bookedDates.has(format(d, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                booked: "bg-accent text-accent-foreground rounded-md",
              }}
            />
          </div>

          {/* Right Side - Bookings List */}
          <div className="flex flex-col">
            <div className="border-b p-6">
              <h3 className="text-center text-lg font-semibold">Waktu Booking</h3>
            </div>

            <ScrollArea className="min-h-[300px] flex-1 p-6">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <CalendarIcon className="text-muted-foreground/50 mb-2 size-12" />
                  <p className="text-muted-foreground">Tidak ada booking PENDING di tanggal ini</p>
                </div>
              ) : (
                <div className="grid grid-flow-col grid-rows-8 gap-2">
                  {bookings.slice(0, 24).map((booking) => (
                    <div
                      key={booking.id}
                      className="hover:bg-accent/50 cursor-pointer rounded px-3 py-2 transition-colors"
                      onClick={() => {
                        window.location.href = `/dashboard/bookings/${booking.id}`;
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="min-w-[52px] font-semibold">{booking.createdTime}</span>
                        <span className="text-muted-foreground">:</span>
                        <span className="truncate text-sm">{booking.serviceName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
