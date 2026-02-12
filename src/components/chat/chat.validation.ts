import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';

const messageContent = () =>
  z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(10000, 'Message must be less than 10000 characters');

export const conversationIdParam = z.object({
  conversation_id: ConfigValidationSchema.uuid(),
});

export const createConversationBody = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  is_group: z.boolean().default(false),
  participant_user_ids: z
    .array(ConfigValidationSchema.uuid())
    .min(1, 'At least one participant is required')
    .max(50, 'Too many participants'),
});

export const listMessagesQuery = z.object({
  offset: ConfigValidationSchema.pagination.offset(),
  limit: ConfigValidationSchema.pagination.limit(),
});

export const sendMessageBody = z.object({
  content: messageContent(),
});

export type CreateConversationBody = z.infer<typeof createConversationBody>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
export type SendMessageBody = z.infer<typeof sendMessageBody>;
