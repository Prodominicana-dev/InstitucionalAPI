import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class servicesUsers{
    @IsString()
    @IsNotEmpty()
    email: string;
}