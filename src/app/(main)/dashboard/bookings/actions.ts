"use server";

import { revalidateTag } from "next/cache";

export async function revalidateBookings() {
  revalidateTag("bookings");
}
