import { ExceptionFilter , Catch, ArgumentsHost , HttpException, HttpStatus } from "@nestjs/common";
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        if(exception instanceof HttpException){
            const status = exception.getStatus();
            const message = exception.message;

            const resBody: ApiResponse<null> = {
                success: false,
                message,
                data: null
            };

            response.status(status).json(resBody);
            return;
        }
        
        const resBody: ApiResponse<null> = {
            success: false,
            message: 'Internal server error',
            data: null
        };
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(resBody)
    }
}