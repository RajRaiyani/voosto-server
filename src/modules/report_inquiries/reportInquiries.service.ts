import { createReportInquiry as createReportInquiryOperation } from './services/opration.service.js';
import RegisterService from '@/core/registerService.js';


export const createReportInquiry = RegisterService(createReportInquiryOperation);