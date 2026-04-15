import { z } from "zod";

const required = { required_error: "שדה חובה", invalid_type_error: "שדה חובה" };

export const signupSchema = z.object({
  full_name: z.string(required).min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
  business_name: z.string().optional(),
  phone: z.string(required).min(9, "מספר טלפון לא תקין"),
  email: z.string(required).email("כתובת אימייל לא תקינה"),
  password: z.string(required).min(8, "סיסמה חייבת להכיל לפחות 8 תווים"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string(required).email("כתובת אימייל לא תקינה"),
  password: z.string(required).min(1, "שדה חובה"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const listingSchema = z.object({
  title: z.string(required).min(3, "כותרת קצרה מדי"),
  property_type: z.enum(["apartment", "house", "penthouse", "land", "commercial"], required),
  rooms: z.coerce.number().min(0).max(20).optional().nullable(),
  size_sqm: z.coerce.number().int().min(1).optional().nullable(),
  price: z.coerce.number().int().min(1, "חובה להזין מחיר"),
  city: z.string(required).min(1, "חובה להזין עיר"),
  neighborhood: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
  total_floors: z.coerce.number().int().optional().nullable(),
  parking: z.boolean().optional(),
  elevator: z.boolean().optional(),
  renovated: z.boolean().optional(),
  description: z.string().optional().nullable(),
  ai_hint: z.string().optional(),
});
export type ListingInput = z.infer<typeof listingSchema>;

export const leadSchema = z.object({
  full_name: z.string(required).min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
  phone: z.string(required).min(9, "מספר טלפון לא תקין"),
  source: z.enum(["whatsapp", "yad2", "instagram", "website", "referral", "manual", "facebook"]).default("manual"),
  budget_min: z.coerce.number().int().optional().nullable(),
  budget_max: z.coerce.number().int().optional().nullable(),
  preferred_rooms: z.coerce.number().optional().nullable(),
  preferred_areas: z.array(z.string()).optional().default([]),
  mortgage_approved: z.boolean().optional().nullable(),
  mortgage_amount: z.coerce.number().int().optional().nullable(),
  timeline: z.enum(["immediate", "1_3_months", "3_6_months", "exploring"]).optional().nullable(),
  notes: z.string().optional().nullable(),
  potential_commission: z.coerce.number().int().optional().default(0),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const generateContentSchema = z.object({
  listing_id: z.string().uuid().optional().nullable(),
  topic: z.string().optional().nullable(),
  post_type: z.enum(["listing_highlight", "market_tip", "neighborhood_guide", "testimonial", "general"]).default("general"),
  platform: z.enum(["instagram", "facebook", "both"]).default("both"),
});
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
