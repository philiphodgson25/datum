import { z } from 'zod';

export const lpaLookupRequestSchema = z
  .object({
    address: z
      .string({
        required_error: 'Address required'
      })
      .trim()
      .min(1, 'Address required')
  })
  .strict();

export const coordinatesSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
  display_name: z.string().min(1).optional()
});

export const lpaRecordSchema = z
  .object({
    id: z.string().optional(),
    entity: z.string().optional(),
    reference: z.string().optional(),
    name: z.string().optional(),
    is_active: z.boolean().optional(),
    centroid: z.unknown().optional(),
    boundary: z.unknown().optional()
  })
  .passthrough();

export const lpaLookupResponseSchema = z.object({
  coordinates: coordinatesSchema,
  lpa: lpaRecordSchema.nullable()
});

export const lpaByPointRequestSchema = z
  .object({
    lat: z.number().finite(),
    lng: z.number().finite()
  })
  .strict();

export type LpaLookupRequest = z.infer<typeof lpaLookupRequestSchema>;
export type LpaLookupResponse = z.infer<typeof lpaLookupResponseSchema>;
export type LpaRecord = z.infer<typeof lpaRecordSchema>;
