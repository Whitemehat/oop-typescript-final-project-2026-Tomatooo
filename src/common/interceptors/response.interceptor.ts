import { CallHandler , ExecutionContext, Injectable , NestInterceptor  } from "@nestjs/common";
import { Observable , map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
    {
        intercept(
            context: ExecutionContext,
            next: CallHandler,
        ): Observable<ApiResponse<T>> {
            return next.handle().pipe(
                map((data) => {
                    if (data && typeof data === 'object' && typeof (data as any).responseMessage === 'string') {
                        return {
                            success: true,
                            message: (data as any).responseMessage as string,
                            data: (data as any).data ?? null,
                        };
                    }
                    return {
                        success: true,
                        message: 'Request successfull',
                        data: data ?? null,
                    };
                })
            );
        }
    }