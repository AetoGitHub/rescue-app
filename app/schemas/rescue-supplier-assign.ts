import * as z from 'zod';

export const rescueSupplierAssignSchema = z.object({
  supplier: z
    .number({ message: 'Selecciona un proveedor' })
    .int()
    .positive('Selecciona un proveedor'),
});

export type RescueSupplierAssignFormState = {
  supplier?: number;
};

export type RescueSupplierAssignFormOutput = z.infer<
  typeof rescueSupplierAssignSchema
>;

export interface RescueSupplierAssignBody {
  supplier: number | null;
}

export function rescueSupplierAssignToBody(
  data: RescueSupplierAssignFormOutput,
): RescueSupplierAssignBody {
  return { supplier: data.supplier ?? null };
}
