import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class ComplainttDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    email: string;


    @IsString()
    @IsNotEmpty()
    message: string;
}