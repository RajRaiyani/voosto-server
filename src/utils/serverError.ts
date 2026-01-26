import Constants from '../config/constant.js';

const { errorCodes } = Constants;

type ServerErrorCode = keyof typeof errorCodes.server;

class ServerError extends Error {
  private code: string;

  private details: any;

  constructor(code: ServerErrorCode, message?: string, details?: any) {
    if (!code) throw new Error('Error code is required in ServerError');

    super();
    this.name = 'ServerError';
    this.code = code;
    this.message = message;
    this.details = details;
  }

  info() {
    const errorObj = errorCodes.server[this.code];

    if (!errorObj) return { httpStatusCode: 500, body: { message: 'internal server error' } };

    return {
      httpStatusCode: errorObj.httpStatusCode,
      body: {
        code: errorObj.body.code,
        message: this.message || errorObj.body.message,
        details: this.details,
      },
    };
  }
}

export default ServerError;
