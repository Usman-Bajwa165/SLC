import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.API_PORT, 10) || 3001,
  prefix: process.env.API_PREFIX || 'api/v1',
  receiptPrefix: process.env.RECEIPT_PREFIX || 'SLC',
  currencySymbol: process.env.CURRENCY_SYMBOL || 'PKR',
  dateLocale: process.env.DATE_LOCALE || 'en-PK',
  fiscalYearStartMonth: parseInt(process.env.FISCAL_YEAR_START_MONTH, 10) || 4,
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'slc_minio_access',
    secretKey: process.env.MINIO_SECRET_KEY || 'slc_minio_secret',
    bucket: process.env.MINIO_BUCKET || 'slc-files',
  },
}));
