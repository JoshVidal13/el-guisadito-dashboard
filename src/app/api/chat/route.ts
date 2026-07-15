import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    messages,
    system: `Eres un asistente financiero y operativo experto, diseñado exclusivamente para "El Guisadito", un negocio de comida.
Tu objetivo es ayudar al dueño a tomar decisiones rentables, analizar sus gastos e ingresos, y optimizar su operación.
Tu tono debe ser profesional, alentador y muy claro. Usa formato Markdown para que tus respuestas sean fáciles de leer (listas, negritas, tablas).
Puedes consultar los registros financieros de la base de datos usando la herramienta 'getFinancialRecords'.
Si el usuario pregunta sobre totales, tendencias, ventas o gastos, SIEMPRE usa la herramienta para obtener los datos reales antes de responder.
Nunca inventes datos. Si no hay datos, indícaselo al usuario.`,
    tools: {
      getFinancialRecords: tool({
        description: 'Obtiene todos los registros financieros (ingresos y egresos) de la base de datos de El Guisadito para su análisis.',
        parameters: z.object({}),
        execute: async () => {
          try {
            const records = await prisma.record.findMany({
              orderBy: { id: 'desc' }
            });
            
            // Agrupar y procesar un poco para no enviar demasiados datos crudos a la vez si son muchos
            const totalIngresos = records.filter(r => r.type === 'ingreso').reduce((sum, r) => sum + r.amount, 0);
            const totalEgresos = records.filter(r => r.type === 'egreso').reduce((sum, r) => sum + r.amount, 0);
            const balance = totalIngresos - totalEgresos;

            return {
              summary: {
                totalIngresos,
                totalEgresos,
                balanceNeto: balance,
                margen: totalIngresos > 0 ? ((balance / totalIngresos) * 100).toFixed(2) + '%' : '0%'
              },
              recentRecords: records.slice(0, 50) // Mandamos los últimos 50 para análisis de tendencias recientes
            };
          } catch (error) {
            return { error: 'No se pudieron recuperar los registros de la base de datos.' };
          }
        },
      }),
    },
  });

  return result.toAIStreamResponse();
}
