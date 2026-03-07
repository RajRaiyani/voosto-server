import type { Context } from '@/core/registerServerEventHandler.js';

export async function createReportInquiry(ctx: Context, { created_by, type = 'general', reference_id, body }: { created_by: string; type?: string; reference_id?: string; body?: string }) {

  const reportInquiry = await ctx.database.queryOne(
    `
    INSERT INTO report_inquiries (created_by, type, reference_id, body)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_by, type, reference_id, body, created_at
  `,
    [created_by, type, reference_id, body]
  );

  return reportInquiry;
};

