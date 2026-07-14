"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Obtener o crear ciclo por defecto (Para evitar errores de foreign key)
async function getOrCreateCycle() {
  let cycle = await prisma.cycle.findFirst();
  if (!cycle) {
    cycle = await prisma.cycle.create({
      data: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        type: "WORK"
      }
    });
  }
  return cycle;
}

export async function getRecords() {
  try {
    const records = await prisma.record.findMany({
      orderBy: { date: 'asc' }
    });
    
    // Mapear al formato del frontend
    return records.map(r => {
      // Parse dates to DD/MM/YYYY format assuming UTC to avoid timezone shifts
      const day = String(r.date.getUTCDate()).padStart(2, '0');
      const month = String(r.date.getUTCMonth() + 1).padStart(2, '0');
      const year = r.date.getUTCFullYear();

      return {
        id: r.id,
        date: `${day}/${month}/${year}`,
        type: r.type.toLowerCase() as "ingreso" | "egreso",
        amount: r.amount,
        category: r.category
      };
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    return [];
  }
}

export async function addRecord(data: { amount: number, type: "ingreso"|"egreso", category: string, dateStr: string }) {
  try {
    const cycle = await getOrCreateCycle();
    
    // Parse DD/MM/YYYY
    const [day, month, year] = data.dateStr.split('/');
    const dateObj = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
    
    await prisma.record.create({
      data: {
        amount: data.amount,
        type: data.type.toUpperCase(),
        category: data.category,
        date: dateObj,
        cycleId: cycle.id
      }
    });
    
    revalidatePath("/records");
    revalidatePath("/");
    revalidatePath("/cycles");
    return { success: true };
  } catch(e) {
    console.error(e);
    return { success: false };
  }
}

export async function updateRecord(id: string, data: { amount: number, category: string, dateStr: string }) {
  try {
    const [day, month, year] = data.dateStr.split('/');
    const dateObj = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));

    await prisma.record.update({
      where: { id },
      data: {
        amount: data.amount,
        category: data.category,
        date: dateObj
      }
    });
    
    revalidatePath("/records");
    revalidatePath("/");
    revalidatePath("/cycles");
    return { success: true };
  } catch(e) {
    console.error(e);
    return { success: false };
  }
}

export async function deleteRecord(id: string) {
  try {
    await prisma.record.delete({
      where: { id }
    });
    
    revalidatePath("/records");
    revalidatePath("/");
    revalidatePath("/cycles");
    return { success: true };
  } catch(e) {
    console.error(e);
    return { success: false };
  }
}
